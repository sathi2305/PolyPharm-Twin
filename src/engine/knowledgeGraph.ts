import { Medicine, BiomedicalGraph, KnowledgeNode, KnowledgeEdge } from '../types';

export function buildDynamicKnowledgeGraph(
  activeDrugs: Medicine[],
  width: number = 800,
  height: number = 550
): BiomedicalGraph {
  const nodes: KnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];
  const nodeMap = new Map<string, KnowledgeNode>();

  const usedNodeIds = new Set<string>();
  const addNode = (node: KnowledgeNode) => {
    if (!usedNodeIds.has(node.id)) {
      usedNodeIds.add(node.id);
      nodes.push(node);
      nodeMap.set(node.id, node);
    }
  };

  const usedEdgeIds = new Set<string>();
  const addEdge = (edge: KnowledgeEdge) => {
    let finalId = edge.id;
    let counter = 1;
    while (usedEdgeIds.has(finalId)) {
      finalId = `${edge.id}_${counter++}`;
    }
    usedEdgeIds.add(finalId);
    edges.push({ ...edge, id: finalId });
  };

  const centerX = width / 2;
  const centerY = height / 2;

  // 1. Add Drug Nodes
  activeDrugs.forEach((drug, index) => {
    const angle = (index / Math.max(1, activeDrugs.length)) * 2 * Math.PI - Math.PI / 2;
    const radius = Math.min(width, height) * 0.28;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const drugNode: KnowledgeNode = {
      id: `drug_${drug.id}`,
      label: drug.genericName,
      type: 'drug',
      data: {
        drugId: drug.id,
        class: drug.drugClass,
        formula: drug.molecularFormula,
        mw: drug.molecularWeight,
        smiles: drug.smiles,
      },
      x,
      y,
      vx: 0,
      vy: 0,
    };
    addNode(drugNode);
  });

  // 2. Add Enzyme Nodes connected to active drugs
  const enzymeUsage = new Map<string, { role: string; drugId: string }[]>();
  activeDrugs.forEach((drug) => {
    drug.enzymes.forEach((enz) => {
      const list = enzymeUsage.get(enz.name) || [];
      list.push({ role: enz.role, drugId: drug.id });
      enzymeUsage.set(enz.name, list);
    });
  });

  let enzIdx = 0;
  const enzCount = enzymeUsage.size;
  enzymeUsage.forEach((connections, enzymeName) => {
    const angle = (enzIdx / Math.max(1, enzCount)) * 2 * Math.PI;
    const radius = Math.min(width, height) * 0.16;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const enzymeNode: KnowledgeNode = {
      id: `enzyme_${enzymeName}`,
      label: enzymeName,
      type: 'enzyme',
      data: {
        family: 'Cytochrome P450 / Phase II',
        connectionsCount: connections.length,
      },
      x,
      y,
      vx: 0,
      vy: 0,
    };
    addNode(enzymeNode);
    enzIdx++;

    // Add edges from drugs to enzymes
    connections.forEach((conn, cIdx) => {
      let relation: KnowledgeEdge['relation'] = 'metabolized_by';
      let weight = 0.7;
      if (conn.role.includes('inhibitor')) {
        relation = 'inhibits';
        weight = 0.95;
      } else if (conn.role === 'inducer') {
        relation = 'induces';
        weight = 0.9;
      }

      addEdge({
        id: `edge_${conn.drugId}_${enzymeName}_${relation}_${cIdx}`,
        source: `drug_${conn.drugId}`,
        target: enzymeNode.id,
        relation: relation,
        weight: weight,
        confidence: 0.95,
        evidence: 'DrugBank / In Vitro Enzymology',
      });
    });
  });

  // 3. Add Target Protein Nodes
  const addedTargets = new Set<string>();
  activeDrugs.forEach((drug, dIdx) => {
    drug.targetProteins.slice(0, 2).forEach((targetName, tIdx) => {
      const targetId = `protein_${targetName.replace(/\s+/g, '_')}`;
      if (!addedTargets.has(targetId)) {
        addedTargets.add(targetId);
        const angle = (dIdx / Math.max(1, activeDrugs.length)) * 2 * Math.PI + 0.3 * (tIdx + 1);
        const radius = Math.min(width, height) * 0.42;

        const targetNode: KnowledgeNode = {
          id: targetId,
          label: targetName,
          type: 'protein',
          data: {
            proteinName: targetName,
            associatedDrug: drug.genericName,
          },
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        };
        addNode(targetNode);
      }

      addEdge({
        id: `edge_${drug.id}_${targetId}_${tIdx}`,
        source: `drug_${drug.id}`,
        target: targetId,
        relation: 'targets',
        weight: 0.85,
        confidence: 0.96,
        evidence: 'UniProt / PDB Crystallography',
      });
    });
  });

  // 4. Add Key Metabolite Nodes
  activeDrugs.forEach((drug, dIdx) => {
    if (drug.metabolites.length > 0) {
      const topMet = drug.metabolites[0];
      const metId = `met_${drug.id}_${topMet.name.replace(/\s+/g, '_')}`;
      const dNode = nodeMap.get(`drug_${drug.id}`);

      if (dNode && dNode.x !== undefined && dNode.y !== undefined) {
        const offsetAngle = Math.random() * 2 * Math.PI;
        const metNode: KnowledgeNode = {
          id: metId,
          label: topMet.name,
          type: 'metabolite',
          data: {
            formula: topMet.formula,
            activity: topMet.activity,
            pathway: topMet.formationPathway,
          },
          x: dNode.x + 60 * Math.cos(offsetAngle),
          y: dNode.y + 60 * Math.sin(offsetAngle),
        };
        addNode(metNode);

        addEdge({
          id: `edge_${drug.id}_${metId}_${dIdx}`,
          source: `drug_${drug.id}`,
          target: metId,
          relation: 'produces',
          weight: 0.75,
          confidence: 0.92,
          evidence: 'Clinical Metabolomics / Phase I/II',
        });
      }
    }
  });

  // 5. Add ADR Outcome Nodes for high-risk pairs
  const adrCategories = [
    { id: 'adr_bleeding', label: 'Major Bleeding Event', cond: activeDrugs.some((d) => d.id === 'warfarin' || d.id === 'rivaroxaban') },
    { id: 'adr_rhabdo', label: 'Rhabdomyolysis Risk', cond: activeDrugs.some((d) => d.id === 'simvastatin' || d.id === 'atorvastatin') && activeDrugs.length > 1 },
    { id: 'adr_serotonin', label: 'Serotonin Toxicity', cond: activeDrugs.some((d) => ['fluoxetine', 'sertraline', 'escitalopram'].includes(d.id)) && activeDrugs.some((d) => ['tramadol', 'linezolid'].includes(d.id)) },
    { id: 'adr_renal', label: 'Acute Renal Failure', cond: activeDrugs.some((d) => ['lisinopril', 'losartan'].includes(d.id)) && activeDrugs.some((d) => ['ibuprofen', 'naproxen'].includes(d.id)) },
    { id: 'adr_qtc', label: 'Torsades de Pointes (QTc)', cond: activeDrugs.some((d) => d.id === 'amiodarone') && activeDrugs.length > 1 },
  ];

  let adrIdx = 0;
  adrCategories.filter((a) => a.cond).forEach((adr) => {
    const angle = (adrIdx / 3) * Math.PI + Math.PI / 4;
    const x = centerX + Math.min(width, height) * 0.44 * Math.cos(angle);
    const y = centerY + Math.min(width, height) * 0.44 * Math.sin(angle);

    const adrNode: KnowledgeNode = {
      id: adr.id,
      label: adr.label,
      type: 'adr',
      data: {
        severity: 'High',
        evidence: 'FDA AERS / TwoSIDES',
      },
      x,
      y,
    };
    addNode(adrNode);
    adrIdx++;

    // Connect to relevant drugs
    activeDrugs.forEach((drug, dIdx) => {
      addEdge({
        id: `edge_${drug.id}_${adr.id}_${adrIdx}_${dIdx}`,
        source: `drug_${drug.id}`,
        target: adr.id,
        relation: 'triggers_adr',
        weight: 0.88,
        confidence: 0.94,
        evidence: 'TwoSIDES Adverse Reaction Graph',
      });
    });
  });

  return { nodes, edges };
}
