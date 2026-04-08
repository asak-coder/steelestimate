# Engineering Calculation Logic Spec for Steel Structure Estimation App

## Purpose
This document defines practical, site-level calculation logic for the steel structure estimation app. It separates:
- **Estimation rules**: quick, pre-design sizing for quotation and feasibility
- **Exact design rules**: code-based engineering checks that must be performed by a licensed engineer before construction

This spec is intended to support:
- steel weight estimation
- quick load assessment
- PEB tonnage estimation
- foundation reaction approximation
- material quantity estimation

---

## Common Result Structure

All calculation outputs should follow this structure:

```json
{
  "inputs": {},
  "assumptions": [],
  "intermediate": {},
  "results": {},
  "warnings": [],
  "codeReferences": []
}
```

### Field meanings
- `inputs`: raw user-entered values and normalized inputs
- `assumptions`: calculation assumptions used for estimation
- `intermediate`: step-by-step derived values
- `results`: final output metrics
- `warnings`: limitations, confidence issues, missing data notices
- `codeReferences`: references to internal services/modules or code locations that informed the logic

---

## 1) Steel Weight Calculator

### Scope
Used to estimate total structural steel weight for:
- beams
- columns
- rafters
- purlins/girts
- bracing
- connection allowance
- miscellaneous steel

### Estimation rules
Use simplified geometry and section-based approximations.

#### General formula
```text
Steel Weight (kg) = Σ [member length (m) × unit weight (kg/m) × quantity] × wastage factor
```

Where:
- `unit weight (kg/m)` is taken from standard section tables or approximated from section dimensions
- wastage factor typically `1.03` to `1.08` for fabrication and site cutting
- connection/bolt/plate allowance typically `2%` to `6%` of main steel

#### If section weight is not directly available
Approximate using area of steel:
```text
Weight (kg/m) = Cross-sectional area (mm²) × 0.00785
```

Because:
- density of steel ≈ `7850 kg/m³`
- 1 mm² over 1 m length = `0.001 m × 7850 kg/m³ = 0.00785 kg`

#### Common quick-estimate allowances
- Main frames: `70% to 80%` of total steel
- Secondary members: `15% to 25%`
- Bracing and misc.: `5% to 10%`

### Exact design rules
- Exact member sizes must be based on structural design for axial, bending, shear, and deflection.
- Bolted/welded connection design must be verified separately.
- Section reduction, local buckling, and serviceability checks require code design.
- Actual fabrication weight should use approved shop drawings.

### Intermediate fields
- `memberWeights`
- `mainFrameWeight`
- `secondarySteelWeight`
- `bracingWeight`
- `miscWeight`
- `wastageAllowance`
- `connectionAllowance`

### Results fields
- `totalSteelWeightKg`
- `totalSteelWeightTon`
- `steelWeightPerSqm`
- `estimatedFabricationWeightKg`

### Caution notes
- Do not use this calculator for final procurement quantities without final drawings.
- Section tables vary by standard and manufacturer.
- Paint, primer, and galvanizing are usually excluded unless explicitly requested.

---

## 2) Load Calculation Basics

### Scope
Quick-estimate load model for:
- dead load
- live load
- wind load
- seismic load
- roof imposed load
- cladding and accessory loads

This is a pre-design level calculator, not a final code design engine.

---

### 2.1 Dead Load

#### Estimation rules
Dead load includes permanent loads:
- self-weight of steel frame
- roofing sheets
- purlins/girts
- insulation
- ceiling, if any
- services fixed to structure

#### Typical roof dead load values
- Lightweight metal roof: `0.10 to 0.20 kN/m²`
- With insulation and accessories: `0.20 to 0.35 kN/m²`
- Heavier roof build-up: up to `0.50 kN/m²`

#### Formula
```text
Total Dead Load = Structural self-weight + roof build-up + permanent attachments
```

---

### 2.2 Live Load

#### Estimation rules
Live load depends on roof accessibility and maintenance usage.

#### Typical quick values
- Non-accessible industrial roof: `0.57 kN/m²` or local code equivalent
- Maintenance roof: `0.75 to 1.00 kN/m²`
- Floor live loads: per use category, if applicable

#### Formula
```text
Live Load = code-based roof live load or project-specific imposed load
```

---

### 2.3 Wind Load

#### Estimation rules
Quick wind load uses basic pressure approximation.

#### Basic formula
```text
qz = 0.6 × V²
```

Where:
- `qz` = basic wind pressure in `N/m²` if `V` is in `m/s`
- `V` = design wind speed

Converted form:
```text
qz (kN/m²) = 0.0006 × V²
```

#### Approximate lateral load on frame
```text
Wind Force = qz × exposed area × pressure coefficient × exposure factor
```

#### Simplified quick-estimate ranges
- Low wind zones: `0.5 to 0.8 kN/m²`
- Moderate wind zones: `0.8 to 1.2 kN/m²`
- High wind zones: `1.2 to 2.0+ kN/m²`

### Exact design rules
- Use governing local wind code parameters:
  - basic wind speed
  - terrain category
  - topography
  - importance factor
  - pressure coefficients
- Wind uplift on roof must be checked separately.
- Edge and corner zones often control design.

---

### 2.4 Seismic Load

#### Estimation rules
Use a simplified base shear estimate.

#### Base shear approximation
```text
V = Sa/g × W × I / R
```

Where:
- `V` = seismic base shear
- `Sa/g` = design spectral acceleration ratio
- `W` = seismic weight
- `I` = importance factor
- `R` = response reduction factor

For quick estimates when code spectrum is unavailable:
- use a conservative percentage of seismic weight
- typical rough range: `5% to 15%` of seismic weight depending on zone and system

### Exact design rules
- Final seismic design must use the governing code response spectrum.
- Mass distribution, diaphragm behavior, irregularity, and soft-storey effects must be checked.
- Foundation and anchor forces must include seismic load combinations.

---

### Intermediate fields
- `deadLoad_kNPerSqm`
- `liveLoad_kNPerSqm`
- `windPressure_kNPerSqm`
- `seismicWeight_kN`
- `baseShear_kN`
- `loadCombinations`

### Results fields
- `governingLoadCase`
- `designRoofLoad_kNPerSqm`
- `designLateralLoad_kN`
- `estimatedTotalLoad_kN`

### Caution notes
- Loads are only as accurate as the geometry and location inputs.
- Final combinations must follow code-prescribed load factors.
- Uplift, drift, and frame stability are not fully captured in quick estimates.

---

## 3) PEB Tonnage Estimation

### Scope
Estimate tonnage for pre-engineered building frames and secondary members.

### Estimation rules
PEB tonnage is typically estimated from:
- building width
- building length
- eave height
- bay spacing
- roof slope
- crane load, if any
- location wind/seismic intensity
- cladding type
- mezzanine or platform loads

#### Quick tonnage intensity method
```text
Total Steel Tonnage = Built-up Area × Steel Intensity
```

Where:
- `Built-up Area = plan width × length`
- `Steel Intensity` typically in `kg/m²`

#### Typical intensity ranges
- Basic shed / light industrial PEB: `25 to 35 kg/m²`
- Medium industrial building: `35 to 45 kg/m²`
- Heavy / crane / high-load PEB: `45 to 70+ kg/m²`

#### More refined formula
```text
Tonnes = (Main Frame Tonnage + Secondary Steel Tonnage + Bracing + Miscellaneous) × contingency
```

Suggested split:
- main frame: `60% to 75%`
- secondary members: `15% to 25%`
- bracing/misc: `5% to 10%`

### Exact design rules
- Tonnage must not replace structural member design.
- Crane loads, mezzanine loads, and high wind zones can significantly increase tonnage.
- Buildings with long spans, heavy rooftop equipment, or high eave heights require project-specific design.

### Intermediate fields
- `builtUpAreaSqm`
- `steelIntensityKgPerSqm`
- `mainFrameTonnageKg`
- `secondaryTonnageKg`
- `bracingTonnageKg`
- `miscTonnageKg`
- `contingencyFactor`

### Results fields
- `estimatedPEBTonnageKg`
- `estimatedPEBTonnageTon`
- `tonnagePerSqm`
- `projectComplexityBand`

### Caution notes
- Two buildings with the same area can have very different tonnages.
- Bay spacing and span drive tonnage strongly.
- Overhead crane systems require special treatment.

---

## 4) Foundation Reaction Approximation

### Scope
Estimate approximate reactions at column bases for early foundation planning.

### Estimation rules
Foundation reactions should be derived from:
- vertical dead load
- roof live load
- wind uplift
- seismic overturning
- frame self-weight
- column load share

#### Simplified vertical reaction
For a typical symmetric frame:
```text
Column Reaction ≈ (Total Vertical Load / Number of Columns Supporting the Load)
```

For a single portal frame:
```text
End Column Reaction ≈ (Dead + Live + Portion of Frame Weight) / 2
```

#### With uplift/checking
```text
Net Base Reaction = Downward Load - Uplift
```

#### Approximate foundation pressure
```text
Soil Pressure = Base Reaction / Footing Area
```

### Exact design rules
- Final foundation design must account for:
  - column moments
  - uplift and anchor bolts
  - eccentricity
  - base plate bearing
  - soil bearing capacity
  - settlement
  - combined axial and moment loads
- Use structural analysis reactions, not only simplified arithmetic, for final design.

### Intermediate fields
- `columnBaseVerticalReaction_kN`
- `columnBaseUplift_kN`
- `columnBaseMoment_kNm`
- `serviceSoilPressure_kPa`
- `requiredFootingAreaSqm`

### Results fields
- `approxBaseReaction_kN`
- `approxUplift_kN`
- `approxFootingSize`
- `preliminaryFoundationLoadClass`

### Caution notes
- Reactions from wind and seismic can control footing design.
- Overturning and uplift may govern more than vertical load.
- Soil report values must always override generic assumptions.

---

## 5) Material Estimation

### Scope
Estimate material quantities for procurement planning and budgetary BOQ.

### Estimation rules
Material estimation should break down into:
- structural steel
- roofing sheets
- cladding sheets
- purlins/girts
- fasteners
- anchor bolts
- base plates
- grout
- concrete for foundations
- reinforcement
- paint/primer

#### Structural steel
Use tonnage or member list:
```text
Structural Steel = total steel weight + fabrication wastage
```

#### Roofing sheets
```text
Roofing Area = roof plan area × slope factor × overlap factor
```

Typical overlap factor:
- `1.03 to 1.10`

#### Cladding sheets
```text
Cladding Area = wall area - openings + lap/waste allowance
```

#### Concrete quantity
```text
Concrete Volume = footing volume + pedestal volume + grade beam volume
```

#### Reinforcement estimate
For quick estimate:
```text
Rebar Weight = Concrete Volume × reinforcement ratio
```

Typical rough reinforcement ratios vary by element and code, so use only for early budgeting.

### Exact design rules
- Material takeoff for procurement must come from detailed drawings and approved schedules.
- Concrete and reinforcement must be calculated from foundation design, not from steel tonnage alone.
- Paint coverage must use manufacturer coverage rates and surface area calculations.

### Intermediate fields
- `roofAreaSqm`
- `wallAreaSqm`
- `openingDeductionSqm`
- `concreteVolumeCum`
- `rebarWeightKg`
- `anchorBoltCount`
- `fastenerCount`

### Results fields
- `structuralSteelKg`
- `roofingSheetAreaSqm`
- `claddingSheetAreaSqm`
- `foundationConcreteCum`
- `reinforcementKg`
- `miscMaterialSummary`

### Caution notes
- Material quantities are highly sensitive to geometry and project specification.
- Procurement quantities should include scrap, overlap, and lap allowances.
- Fasteners and accessories should be controlled by vendor system requirements.

---

## 6) Assumptions Library

### Standard quick-estimate assumptions
These assumptions can be used when detailed inputs are missing:

- Steel density: `7850 kg/m³`
- Fabrication/wastage allowance: `3% to 8%`
- Connection allowance: `2% to 6%`
- Roofing overlap/waste: `3% to 10%`
- Secondary steel share: `15% to 25%`
- Bracing/misc share: `5% to 10%`
- PEB steel intensity: `25 to 70+ kg/m²` depending on use
- Roof live load: code-based default or `0.57 to 1.0 kN/m²` quick estimate
- Wind pressure: derived from design wind speed or quick zone assumption
- Seismic load: spectrum-based if available; otherwise conservative percentage of seismic weight

### Assumption handling rules
- Every estimate should explicitly store the assumptions used.
- If a value is estimated from defaults, mark it as low-confidence.
- If project inputs are incomplete, fallback values may be used, but warnings must be generated.

---

## 7) Warning and Limitation Rules

Every calculation should generate warnings when:
- span, bay spacing, or roof slope is missing
- wind speed, seismic zone, or soil data is unavailable
- crane load or mezzanine load is unspecified
- the building is outside the normal PEB range
- the estimate is being used for procurement or construction without final design
- the system detects unusually high or low steel intensity

Suggested warning categories:
- `info`
- `lowConfidence`
- `missingInput`
- `designRequired`
- `codeComplianceRequired`

---

## 8) Output Contract for Calculation Services

Each service should return a consistent object like:

```json
{
  "inputs": {
    "projectType": "PEB",
    "length": 50,
    "width": 30,
    "eaveHeight": 8,
    "windSpeed": 39
  },
  "assumptions": [
    "Steel density assumed at 7850 kg/m3",
    "Secondary steel estimated at 20% of total structural steel"
  ],
  "intermediate": {
    "builtUpAreaSqm": 1500,
    "steelIntensityKgPerSqm": 32,
    "estimatedSteelKg": 48000
  },
  "results": {
    "estimatedSteelTon": 48,
    "steelWeightPerSqm": 32,
    "governingLoadCase": "wind"
  },
  "warnings": [
    "Wind speed was estimated from default zone value",
    "Final structural design required before procurement"
  ],
  "codeReferences": [
    "services/designEngine.js",
    "services/loadEngine.js",
    "services/pebCalculationService.js",
    "services/boqService.js",
    "services/costService.js",
    "services/soilEngine.js",
    "services/pricingOptimizationService.js",
    "components/PEBDrawing.jsx"
  ]
}
```

---

## 9) Recommended Module Responsibilities

### designEngine
- combine geometry, load, and section logic
- generate preliminary frame member sizes
- estimate member weight and tonnage

### loadEngine
- compute dead, live, wind, and seismic quick loads
- provide governing load case summary
- supply service/load combinations for pre-design

### pebCalculationService
- calculate PEB tonnage from area and complexity
- classify building type by tonnage intensity
- produce estimation warnings

### boqService
- convert calculated quantities into BOQ line items
- summarize steel, concrete, roofing, and accessory quantities

### costService
- apply unit rates to BOQ quantities
- include contingency and overhead rules
- compute budgetary project cost

### soilEngine
- estimate foundation bearing demand
- compare base reactions against allowable soil capacity
- provide preliminary footing sizing guidance

### pricingOptimizationService
- compare alternate material grade or frame strategies
- optimize cost vs tonnage vs span efficiency
- recommend lowest-risk budget scenario

### PEBDrawing.jsx
- visualize frame layout assumptions
- show span, bay spacing, roof slope, and frame type
- provide user-facing explanation of estimate output

---

## 10) Exact Design vs Estimation Rules Summary

### Estimation rules
Use for:
- quotations
- concept planning
- early feasibility
- budgetary proposals

Characteristics:
- simplified
- conservative
- assumption-driven
- fast to compute

### Exact design rules
Use for:
- final structural drawings
- construction approval
- procurement release
- permit submission

Characteristics:
- code-based
- load combinations enforced
- member-level verification required
- soil/foundation design required
- reviewed by qualified structural engineer

---

## 11) Final Implementation Guidance

The app should:
1. accept geometric and site inputs
2. compute quick loads and tonnage estimates
3. derive material quantities and preliminary foundation reactions
4. store all assumptions and warnings with the result
5. clearly label outputs as estimation only unless design-grade validation is completed

Any code that consumes these rules should always return:
- `inputs`
- `assumptions`
- `intermediate`
- `results`
- `warnings`
- `codeReferences`

and should never present estimated values as final structural design values.