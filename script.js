/* ============================================================
   COMPUTATIONAL TOOLBOX - JAVASCRIPT ENGINE
   Tab Controller, Stoichiometry Parser, Physics Formulas, Math Operations
   ============================================================ */

// ============ TAB SWITCHING CONTROLLER ============
document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize tab switcher
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      
      // Remove active class from all nav items and tabs
      navItems.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.add('hidden'));
      
      // Add active class to clicked nav item and corresponding tab
      this.classList.add('active');
      document.getElementById(tabName).classList.remove('hidden');
    });
  });

  // Initialize stoichiometry event listeners
  initStoichiometry();
  
  // Initialize physics event listeners
  initPhysics();
  
  // Initialize mathematics event listeners
  initMathematics();
});

/* ============================================================
   STOICHIOMETRY MODULE
   ============================================================ */

function initStoichiometry() {
  const equationInput = document.getElementById('unbalanced-equation');
  
  // Real-time equation parsing on input
  if (equationInput) {
    equationInput.addEventListener('input', function() {
      parseEquation(this.value);
    });
  }

  // Calculate stoichiometry button
  const calcBtn = document.getElementById('calculate-stoichiometry');
  if (calcBtn) {
    calcBtn.addEventListener('click', calculateStoichiometry);
  }

  // Calculate limiting reactant button
  const limitingBtn = document.getElementById('calculate-limiting-reactant');
  if (limitingBtn) {
    limitingBtn.addEventListener('click', calculateLimitingReactant);
  }
}

/**
 * SAFE EQUATION PARSER - Non-blocking, no infinite loops
 * Handles incomplete input gracefully
 */
function safeEquationParser(inputStr) {
  // Early return for empty input
  if (!inputStr || inputStr.trim() === '') {
    return { 
      valid: false, 
      message: "Please enter a chemical equation",
      reactants: null,
      products: null
    };
  }

  // Clean input: remove spaces
  let cleanInput = inputStr.replace(/\s+/g, '');
  
  // Support both -> and → arrow symbols
  let arrowIndex = -1;
  if (cleanInput.includes('->')) {
    arrowIndex = cleanInput.indexOf('->');
  } else if (cleanInput.includes('→')) {
    arrowIndex = cleanInput.indexOf('→');
  }
  
  // Check if arrow exists - if not, return early (NO LOOPING)
  if (arrowIndex === -1) {
    return { 
      valid: false, 
      message: "Incomplete equation. Please add a reaction arrow (-> or →)",
      reactants: null,
      products: null
    };
  }
  
  // Use definitive split at arrow position
  const reactants = cleanInput.substring(0, arrowIndex);
  const products = cleanInput.substring(arrowIndex + 2); // Skip the '->'
  
  // Validate both halves exist and are non-empty
  if (!reactants || reactants === '') {
    return { 
      valid: false, 
      message: "No reactants specified before arrow",
      reactants: null,
      products: null
    };
  }
  
  if (!products || products === '') {
    return { 
      valid: false, 
      message: "No products specified after arrow",
      reactants: null,
      products: null
    };
  }
  
  // Success: return parsed equation
  return { 
    valid: true, 
    message: "Equation parsed successfully",
    reactants: reactants, 
    products: products 
  };
}

/**
 * Parse and display equation in real-time
 */
function parseEquation(inputValue) {
  const result = safeEquationParser(inputValue);
  const errorDiv = document.getElementById('equation-error');
  const resultDiv = document.getElementById('equation-result');
  
  if (!result.valid) {
    // Show error state only if arrow was typed but incomplete
    if (inputValue.includes('-') || inputValue.includes('→')) {
      errorDiv.textContent = '⚠️ ' + result.message;
      errorDiv.classList.remove('hidden');
      resultDiv.classList.add('hidden');
    } else {
      errorDiv.classList.add('hidden');
      resultDiv.classList.add('hidden');
    }
  } else {
    // Show successful parse
    errorDiv.classList.add('hidden');
    resultDiv.textContent = `✓ Reactants: ${result.reactants} | Products: ${result.products}`;
    resultDiv.classList.remove('hidden');
    
    // Store parsed equation for mass calculations
    window.currentEquation = result;
    document.getElementById('balanced-equation-display').value = inputValue;
  }
}

/**
 * Extract compounds and their coefficients from equation string
 */
function parseCompounds(compoundStr) {
  const compounds = [];
  const parts = compoundStr.split('+').map(p => p.trim());
  
  parts.forEach(part => {
    if (part) {
      // Extract coefficient and formula
      const match = part.match(/^(\d*)(.+)$/);
      const coeff = match[1] ? parseInt(match[1]) : 1;
      const formula = match[2];
      compounds.push({ coefficient: coeff, formula: formula });
    }
  });
  
  return compounds;
}

/**
 * Calculate molar mass of a compound (simplified - assumes basic elements)
 */
function calculateMolarMass(formula) {
  // Simplified molar mass lookup
  const atomicMasses = {
    'H': 1.008, 'C': 12.01, 'N': 14.01, 'O': 16.00, 'S': 32.06,
    'P': 30.97, 'Cl': 35.45, 'Fe': 55.845, 'Ca': 40.08, 'Na': 22.99,
    'K': 39.10, 'Mg': 24.31, 'Al': 26.98
  };
  
  let mass = 0;
  let i = 0;
  
  while (i < formula.length) {
    // Capital letter starts an element
    if (/[A-Z]/.test(formula[i])) {
      let element = formula[i];
      i++;
      
      // Check for lowercase letter
      while (i < formula.length && /[a-z]/.test(formula[i])) {
        element += formula[i];
        i++;
      }
      
      // Check for number after element
      let count = '';
      while (i < formula.length && /\d/.test(formula[i])) {
        count += formula[i];
        i++;
      }
      count = count ? parseInt(count) : 1;
      
      // Add to mass
      if (atomicMasses[element]) {
        mass += atomicMasses[element] * count;
      }
    } else if (formula[i] === '(' || formula[i] === ')') {
      // Skip parentheses for simplification
      i++;
    } else {
      i++;
    }
  }
  
  return mass || 0;
}

/**
 * Calculate stoichiometric yield
 */
function calculateStoichiometry() {
  if (!window.currentEquation || !window.currentEquation.valid) {
    alert('Please enter a valid balanced equation first');
    return;
  }
  
  const reactants = parseCompounds(window.currentEquation.reactants);
  const products = parseCompounds(window.currentEquation.products);
  
  // Build reactants inputs
  const reactantsContainer = document.getElementById('reactants-container');
  reactantsContainer.innerHTML = '<h4 class="equation-header">Reactant Masses (grams)</h4>';
  
  reactants.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label class="form-label">${r.formula} (coefficient: ${r.coefficient})</label>
      <input type="number" id="reactant-${idx}" class="form-input" placeholder="0" step="any">
    `;
    reactantsContainer.appendChild(div);
  });
  
  // Build products display
  const productsContainer = document.getElementById('products-container');
  productsContainer.innerHTML = '<h4 class="equation-header" style="margin-top: 24px;">Expected Products (grams)</h4>';
  
  products.forEach((p, idx) => {
    const div = document.createElement('div');
    div.className = 'form-group';
    div.innerHTML = `
      <label class="form-label">${p.formula} (coefficient: ${p.coefficient})</label>
      <input type="text" id="product-${idx}" class="form-input" disabled readonly>
    `;
    productsContainer.appendChild(div);
  });
  
  // Show calculate button
  document.getElementById('calculate-stoichiometry').classList.remove('hidden');
  document.getElementById('calculate-stoichiometry').addEventListener('click', () => {
    const results = [];
    let moles = [];
    
    // Get moles of each reactant
    reactants.forEach((r, idx) => {
      const mass = parseFloat(document.getElementById(`reactant-${idx}`).value) || 0;
      const molarMass = calculateMolarMass(r.formula);
      const molAmount = mass / molarMass;
      moles.push(molAmount);
    });
    
    // Calculate theoretical yield for products
    products.forEach((p, idx) => {
      const molarMass = calculateMolarMass(p.formula);
      // Use first reactant's mole ratio (simplified)
      const theoreticalMoles = (moles[0] / reactants[0].coefficient) * p.coefficient;
      const theoreticalMass = theoreticalMoles * molarMass;
      document.getElementById(`product-${idx}`).value = theoreticalMass.toFixed(3);
    });
    
    // Display results
    const resultsDiv = document.getElementById('stoichiometry-results');
    resultsDiv.innerHTML = '<div class="result-group success"><div class="result-label">Calculation Complete</div><div class="result-value">✓ Theoretical yields calculated</div></div>';
    resultsDiv.classList.remove('hidden');
  });
}

/**
 * Calculate limiting reactant
 */
function calculateLimitingReactant() {
  alert('Limiting Reactant feature coming soon - Enter masses and we\'ll identify the limiting reactant using AMR/RMR method');
}

/* ============================================================
   PHYSICS MODULE
   ============================================================ */

function initPhysics() {
  const kinematicsBtn = document.getElementById('calculate-kinematics');
  const waveBtn = document.getElementById('calculate-wave');
  
  if (kinematicsBtn) {
    kinematicsBtn.addEventListener('click', solveKinematics);
  }
  
  if (waveBtn) {
    waveBtn.addEventListener('click', solveWaveEquation);
  }
}

/**
 * Solve SUVAT kinematics equations
 * s = displacement, u = initial velocity, v = final velocity, a = acceleration, t = time
 */
function solveKinematics() {
  const s = document.getElementById('kin-s').value;
  const u = document.getElementById('kin-u').value;
  const v = document.getElementById('kin-v').value;
  const a = document.getElementById('kin-a').value;
  const t = document.getElementById('kin-t').value;
  
  const values = {
    s: s === '' ? null : parseFloat(s),
    u: u === '' ? null : parseFloat(u),
    v: v === '' ? null : parseFloat(v),
    a: a === '' ? null : parseFloat(a),
    t: t === '' ? null : parseFloat(t)
  };
  
  // Count known values
  const knownCount = Object.values(values).filter(v => v !== null).length;
  
  if (knownCount < 3) {
    alert('Please enter at least 3 known values');
    return;
  }
  
  const results = {};
  
  // SUVAT equations:
  // v = u + at
  // s = ut + 0.5at²
  // v² = u² + 2as
  // s = 0.5(u + v)t
  
  if (values.s === null && values.u !== null && values.v !== null && values.a !== null) {
    results.s = (values.v * values.v - values.u * values.u) / (2 * values.a);
  }
  if (values.u === null && values.v !== null && values.a !== null && values.t !== null) {
    results.u = values.v - values.a * values.t;
  }
  if (values.v === null && values.u !== null && values.a !== null && values.t !== null) {
    results.v = values.u + values.a * values.t;
  }
  if (values.a === null && values.u !== null && values.v !== null && values.t !== null) {
    results.a = (values.v - values.u) / values.t;
  }
  if (values.t === null && values.u !== null && values.v !== null && values.a !== null) {
    results.t = (values.v - values.u) / values.a;
  }
  
  // Display results
  const resultsDiv = document.getElementById('kinematics-results');
  let html = '';
  
  Object.keys(results).forEach(key => {
    const labels = { s: 'Displacement (m)', u: 'Initial Velocity (m/s)', v: 'Final Velocity (m/s)', a: 'Acceleration (m/s²)', t: 'Time (s)' };
    html += `<div class="result-group success"><div class="result-label">${labels[key]}</div><div class="result-value">${results[key].toFixed(4)}</div></div>`;
  });
  
  resultsDiv.innerHTML = html || '<div class="result-group error"><div class="result-label">No Solution</div><div class="result-value">Cannot solve with given values</div></div>';
  resultsDiv.classList.remove('hidden');
}

/**
 * Solve wave equation: v = f × λ
 */
function solveWaveEquation() {
  const v = document.getElementById('wave-v').value;
  const f = document.getElementById('wave-f').value;
  const lambda = document.getElementById('wave-lambda').value;
  
  const values = {
    v: v === '' ? null : parseFloat(v),
    f: f === '' ? null : parseFloat(f),
    lambda: lambda === '' ? null : parseFloat(lambda)
  };
  
  const knownCount = Object.values(values).filter(v => v !== null).length;
  
  if (knownCount < 2) {
    alert('Please enter at least 2 known values');
    return;
  }
  
  const results = {};
  
  if (values.v === null && values.f !== null && values.lambda !== null) {
    results.v = values.f * values.lambda;
  }
  if (values.f === null && values.v !== null && values.lambda !== null) {
    results.f = values.v / values.lambda;
  }
  if (values.lambda === null && values.v !== null && values.f !== null) {
    results.lambda = values.v / values.f;
  }
  
  // Display results
  const resultsDiv = document.getElementById('wave-results');
  let html = '';
  
  if (results.v !== undefined) {
    html += `<div class="result-group success"><div class="result-label">Velocity (m/s)</div><div class="result-value">${results.v.toFixed(4)}</div></div>`;
  }
  if (results.f !== undefined) {
    html += `<div class="result-group success"><div class="result-label">Frequency (Hz)</div><div class="result-value">${results.f.toFixed(4)}</div></div>`;
  }
  if (results.lambda !== undefined) {
    html += `<div class="result-group success"><div class="result-label">Wavelength (m)</div><div class="result-value">${results.lambda.toFixed(4)}</div></div>`;
  }
  
  resultsDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

/* ============================================================
   MATHEMATICS MODULE
   ============================================================ */

function initMathematics() {
  // Quadratic solver
  const quadBtn = document.getElementById('calculate-quadratic');
  if (quadBtn) {
    quadBtn.addEventListener('click', solveQuadratic);
  }
  
  // Simultaneous equations buttons
  const simul2Btn = document.getElementById('simul-2vars-btn');
  const simul3Btn = document.getElementById('simul-3vars-btn');
  
  if (simul2Btn) {
    simul2Btn.addEventListener('click', () => {
      document.getElementById('simul-2vars-container').classList.remove('hidden');
      document.getElementById('simul-3vars-container').classList.add('hidden');
      document.getElementById('calculate-simultaneous').classList.remove('hidden');
    });
  }
  
  if (simul3Btn) {
    simul3Btn.addEventListener('click', () => {
      document.getElementById('simul-2vars-container').classList.add('hidden');
      document.getElementById('simul-3vars-container').classList.remove('hidden');
      document.getElementById('calculate-simultaneous').classList.remove('hidden');
    });
  }
  
  const simulBtn = document.getElementById('calculate-simultaneous');
  if (simulBtn) {
    simulBtn.addEventListener('click', solveSimultaneous);
  }
  
  // Matrix buttons
  const matrix2Btn = document.getElementById('matrix-2x2-btn');
  const matrix3Btn = document.getElementById('matrix-3x3-btn');
  
  if (matrix2Btn) {
    matrix2Btn.addEventListener('click', () => initMatrix(2));
  }
  
  if (matrix3Btn) {
    matrix3Btn.addEventListener('click', () => initMatrix(3));
  }
}

/**
 * Solve quadratic equation: ax² + bx + c = 0
 */
function solveQuadratic() {
  const a = parseFloat(document.getElementById('quad-a').value) || 0;
  const b = parseFloat(document.getElementById('quad-b').value) || 0;
  const c = parseFloat(document.getElementById('quad-c').value) || 0;
  
  if (a === 0) {
    alert('Coefficient a cannot be zero for a quadratic equation');
    return;
  }
  
  const discriminant = b * b - 4 * a * c;
  const resultsDiv = document.getElementById('quadratic-results');
  let html = '';
  
  // Display discriminant
  html += `<div class="result-group"><div class="result-label">Discriminant (Δ = b² - 4ac)</div><div class="result-value">${discriminant.toFixed(4)}</div></div>`;
  
  if (discriminant > 0) {
    // Two real roots
    const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    html += `<div class="result-group success"><div class="result-label">Root 1 (x₁)</div><div class="result-value">${root1.toFixed(4)}</div></div>`;
    html += `<div class="result-group success"><div class="result-label">Root 2 (x₂)</div><div class="result-value">${root2.toFixed(4)}</div></div>`;
  } else if (discriminant === 0) {
    // One root
    const root = -b / (2 * a);
    html += `<div class="result-group success"><div class="result-label">Root (x)</div><div class="result-value">${root.toFixed(4)}</div></div>`;
  } else {
    // Complex roots
    const realPart = (-b) / (2 * a);
    const imagPart = Math.sqrt(-discriminant) / (2 * a);
    html += `<div class="result-group warning"><div class="result-label">Root 1</div><div class="result-value">${realPart.toFixed(4)} + ${imagPart.toFixed(4)}i</div></div>`;
    html += `<div class="result-group warning"><div class="result-label">Root 2</div><div class="result-value">${realPart.toFixed(4)} - ${imagPart.toFixed(4)}i</div></div>`;
  }
  
  resultsDiv.innerHTML = html;
  resultsDiv.classList.remove('hidden');
}

/**
 * Solve simultaneous equations using Cramer's Rule
 */
function solveSimultaneous() {
  const container2 = document.getElementById('simul-2vars-container');
  const container3 = document.getElementById('simul-3vars-container');
  
  if (!container2.classList.contains('hidden')) {
    solve2x2Simultaneous();
  } else {
    solve3x3Simultaneous();
  }
}

function solve2x2Simultaneous() {
  // a₁x + b₁y = c₁
  // a₂x + b₂y = c₂
  
  const a1 = parseFloat(document.getElementById('s2a1').value) || 0;
  const b1 = parseFloat(document.getElementById('s2b1').value) || 0;
  const c1 = parseFloat(document.getElementById('s2c1').value) || 0;
  const a2 = parseFloat(document.getElementById('s2a2').value) || 0;
  const b2 = parseFloat(document.getElementById('s2b2').value) || 0;
  const c2 = parseFloat(document.getElementById('s2c2').value) || 0;
  
  // Using Cramer's Rule
  const det = a1 * b2 - a2 * b1;
  
  if (det === 0) {
    document.getElementById('simultaneous-results').innerHTML = '<div class="result-group error"><div class="result-label">No Solution</div><div class="result-value">System has no unique solution (determinant = 0)</div></div>';
    document.getElementById('simultaneous-results').classList.remove('hidden');
    return;
  }
  
  const x = (c1 * b2 - c2 * b1) / det;
  const y = (a1 * c2 - a2 * c1) / det;
  
  const html = `
    <div class="result-group success"><div class="result-label">x</div><div class="result-value">${x.toFixed(4)}</div></div>
    <div class="result-group success"><div class="result-label">y</div><div class="result-value">${y.toFixed(4)}</div></div>
  `;
  
  document.getElementById('simultaneous-results').innerHTML = html;
  document.getElementById('simultaneous-results').classList.remove('hidden');
}

function solve3x3Simultaneous() {
  // Using Cramer's Rule for 3x3 system
  const a1 = parseFloat(document.getElementById('s3a1').value) || 0;
  const b1 = parseFloat(document.getElementById('s3b1').value) || 0;
  const c1 = parseFloat(document.getElementById('s3c1').value) || 0;
  const d1 = parseFloat(document.getElementById('s3d1').value) || 0;
  
  const a2 = parseFloat(document.getElementById('s3a2').value) || 0;
  const b2 = parseFloat(document.getElementById('s3b2').value) || 0;
  const c2 = parseFloat(document.getElementById('s3c2').value) || 0;
  const d2 = parseFloat(document.getElementById('s3d2').value) || 0;
  
  const a3 = parseFloat(document.getElementById('s3a3').value) || 0;
  const b3 = parseFloat(document.getElementById('s3b3').value) || 0;
  const c3 = parseFloat(document.getElementById('s3c3').value) || 0;
  const d3 = parseFloat(document.getElementById('s3d3').value) || 0;
  
  // Calculate determinant of coefficient matrix
  const det = a1 * (b2 * c3 - b3 * c2) - b1 * (a2 * c3 - a3 * c2) + c1 * (a2 * b3 - a3 * b2);
  
  if (det === 0) {
    document.getElementById('simultaneous-results').innerHTML = '<div class="result-group error"><div class="result-label">No Solution</div><div class="result-value">System has no unique solution (determinant = 0)</div></div>';
    document.getElementById('simultaneous-results').classList.remove('hidden');
    return;
  }
  
  // Cramer's Rule for x, y, z
  const detX = d1 * (b2 * c3 - b3 * c2) - b1 * (d2 * c3 - d3 * c2) + c1 * (d2 * b3 - d3 * b2);
  const detY = a1 * (d2 * c3 - d3 * c2) - d1 * (a2 * c3 - a3 * c2) + c1 * (a2 * d3 - a3 * d2);
  const detZ = a1 * (b2 * d3 - b3 * d2) - b1 * (a2 * d3 - a3 * d2) + d1 * (a2 * b3 - a3 * b2);
  
  const x = detX / det;
  const y = detY / det;
  const z = detZ / det;
  
  const html = `
    <div class="result-group success"><div class="result-label">x</div><div class="result-value">${x.toFixed(4)}</div></div>
    <div class="result-group success"><div class="result-label">y</div><div class="result-value">${y.toFixed(4)}</div></div>
    <div class="result-group success"><div class="result-label">z</div><div class="result-value">${z.toFixed(4)}</div></div>
  `;
  
  document.getElementById('simultaneous-results').innerHTML = html;
  document.getElementById('simultaneous-results').classList.remove('hidden');
}

/**
 * Initialize matrix operations
 */
function initMatrix(size) {
  const container = size === 2 ? document.getElementById('matrix-2x2-container') : document.getElementById('matrix-3x3-container');
  const gridClass = size === 2 ? 'matrix-grid-2x2' : 'matrix-grid-3x3';
  
  container.classList.remove('hidden');
  
  // Create matrix inputs if not already created
  const gridA = document.getElementById(`matrix-a-${size}x${size}`);
  const gridB = document.getElementById(`matrix-b-${size}x${size}`);
  
  if (gridA.children.length === 0) {
    for (let i = 0; i < size * size; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'matrix-input';
      input.placeholder = '0';
      input.step = 'any';
      gridA.appendChild(input);
    }
  }
  
  if (gridB.children.length === 0) {
    for (let i = 0; i < size * size; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'matrix-input';
      input.placeholder = '0';
      input.step = 'any';
      gridB.appendChild(input);
    }
  }
  
  // Attach event listeners to operation buttons
  const opButtons = document.querySelectorAll(`.matrix-op-btn[data-size="${size}x${size}"]`);
  opButtons.forEach(btn => {
    btn.addEventListener('click', () => performMatrixOperation(size, btn.getAttribute('data-op')));
  });
}

/**
 * Perform matrix operations
 */
function performMatrixOperation(size, operation) {
  const matrixA = getMatrixFromGrid(size, 'a');
  const matrixB = getMatrixFromGrid(size, 'b');
  const resultGrid = document.getElementById(`matrix-result-${size}x${size}`);
  
  let result;
  
  switch(operation) {
    case 'add':
      result = addMatrices(matrixA, matrixB);
      break;
    case 'subtract':
      result = subtractMatrices(matrixA, matrixB);
      break;
    case 'multiply':
      result = multiplyMatrices(matrixA, matrixB, size);
      break;
    case 'determinant':
      result = size === 2 ? [[determinant2x2(matrixA)]] : [[determinant3x3(matrixA)]];
      break;
    case 'inverse':
      result = size === 2 ? inverse2x2(matrixA) : inverse3x3(matrixA);
      break;
  }
  
  // Display result
  resultGrid.innerHTML = '';
  result.forEach(row => {
    row.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';
      cell.textContent = isNaN(val) ? 'N/A' : val.toFixed(4);
      resultGrid.appendChild(cell);
    });
  });
}

function getMatrixFromGrid(size, matrixLabel) {
  const grid = document.getElementById(`matrix-${matrixLabel}-${size}x${size}`);
  const matrix = [];
  const inputs = grid.querySelectorAll('.matrix-input');
  
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(parseFloat(inputs[i * size + j].value) || 0);
    }
    matrix.push(row);
  }
  
  return matrix;
}

function addMatrices(a, b) {
  return a.map((row, i) => row.map((val, j) => val + b[i][j]));
}

function subtractMatrices(a, b) {
  return a.map((row, i) => row.map((val, j) => val - b[i][j]));
}

function multiplyMatrices(a, b, size) {
  const result = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  
  return result;
}

function determinant2x2(matrix) {
  return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function determinant3x3(matrix) {
  return matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1])
       - matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0])
       + matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
}

function inverse2x2(matrix) {
  const det = determinant2x2(matrix);
  
  if (det === 0) {
    return [[NaN, NaN], [NaN, NaN]];
  }
  
  return [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det]
  ];
}

function inverse3x3(matrix) {
  const det = determinant3x3(matrix);
  
  if (det === 0) {
    return [[NaN, NaN, NaN], [NaN, NaN, NaN], [NaN, NaN, NaN]];
  }
  
  const adj = [
    [
      matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1],
      -(matrix[0][1] * matrix[2][2] - matrix[0][2] * matrix[2][1]),
      matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]
    ],
    [
      -(matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]),
      matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0],
      -(matrix[0][0] * matrix[1][2] - matrix[0][2] * matrix[1][0])
    ],
    [
      matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0],
      -(matrix[0][0] * matrix[2][1] - matrix[0][1] * matrix[2][0]),
      matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
    ]
  ];
  
  return adj.map(row => row.map(val => val / det));
}

/* ============================================================
   END OF SCRIPT
   ============================================================ */
