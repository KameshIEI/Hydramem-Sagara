import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms'; // Import ReactiveFormsModule here
import { CommonModule } from '@angular/common'; // Import CommonModule for *ngIf, etc.
import { DataService } from '../../services/data';
import { ResultsDisplay } from '../results-display/results-display'; // Import Child Component
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-projection-form',
  standalone: true, // Mark as standalone
  imports: [
    CommonModule, // Needed for *ngIf, *ngFor etc. in the template
    ReactiveFormsModule, // Needed for formGroup, formControlName
    ResultsDisplay // Import the child component
  ],
  templateUrl: './projection-form.html',
  styleUrls: ['./projection-form.css'] // Adjusted to styleUrls
})
export class ProjectionFormComponent implements OnInit, OnDestroy {

  // --- All properties and constructor from previous step ---
  projectionForm: FormGroup;
  csvData: any[] = [];
  foundResult: any = null;
  result: any = null; // Add this property
    // If CSV contains multiple candidate rows matching the key inputs,
    // they will be stored here so the UI can present them to the user.
    foundCandidates: any[] = [];
    // Pre-computed aggregated candidate (numeric fields averaged) when duplicates exist
    aggregatedResult: any | null = null;
  submitted: boolean = false;
  calculationMessage: string = '';
  private formChangesSubscription: Subscription | null = null;
    // Bound listener so it can be removed on destroy
    private _clearStorageListener: any = null;
  selectedStages: number = 1;
  selectedWaterSources: number = 1;
  flowUnit: string = 'm³/hr';
  pressureUnit: string = 'bar';
  fluxUnit: string = 'lmh';
  temperatureUnit: string = '°C';

  constructor(private fb: FormBuilder, private dataService: DataService, private cdr: ChangeDetectorRef) {
     // --- Identical form group definition from previous answer ---
     this.projectionForm = this.fb.group({
         txtProjectName: ['', Validators.required],
         txtDesignerName: ['', Validators.required],
         drpflow: ['m³/hr', Validators.required],
         drpPressure: ['bar', Validators.required],
         drpFlux: ['lmh', Validators.required],
         drpTemperature: ['°C', Validators.required],
         txtDesiredPermeateFlowRate: [0, [Validators.required, Validators.min(0)]],
         txtRecovery: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
         txtFeedFlow: [{ value: 0, disabled: true }],
         txtConcentrateFlow: [{ value: 0, disabled: true }],
         drpDosingChemical: ['No'],
         txtConcentrateRecycle: [{ value: 0, disabled: true }],
         txtAdjustedConcentrateFlow: [{ value: 0, disabled: true }],
         drpNoOfProposedStages: [1, Validators.required],
         noofwatersource: [1, Validators.required],
         drpWaterSource1: ['', Validators.required],
         SDIVal1: ['', Validators.required],
         txtWaterTemperatute1: [25, [Validators.required, Validators.min(0)]],
         pH1: [7.5, [Validators.required, Validators.min(0), Validators.max(14)]],
         quantitywater1: [100, [Validators.required, Validators.min(0)]],
         sodmgl1: [0, Validators.min(0)], sodcaco1: [0, Validators.min(0)], calmgl1: [0, Validators.min(0)], calcaco1: [0, Validators.min(0)], magmgl1: [0, Validators.min(0)],
         potmgl1: [0, Validators.min(0)], ammomgl1: [0, Validators.min(0)], bamgl1: [0, Validators.min(0)],
         stromgl1: [0, Validators.min(0)], ironmgl1: [0, Validators.min(0)], bicarmgl1: [0, Validators.min(0)],
         chloridemgl1: [0, Validators.min(0)], sulpmgl1: [0, Validators.min(0)], nitmgl1: [0, Validators.min(0)],
         silimgl1: [0, Validators.min(0)], flumgl1: [0, Validators.min(0)], bormgl1: [0, Validators.min(0)],
         phosmgl1: [0, Validators.min(0)],
    // Calculated / final water quality controls (used in Ion Load tab)
    sodmgl: [{ value: 0, disabled: true }],
    sodcaco: [{ value: 0, disabled: true }],
    calmgl: [{ value: 0, disabled: true }],
    calcaco: [{ value: 0, disabled: true }],
    pH: [{ value: 7.5, disabled: true }],
    txtWaterTemperatute: [{ value: 25, disabled: true }],
    SDIVal: [{ value: '', disabled: true }],
    drpWaterSource: [{ value: '', disabled: true }],
    // Optional final display fields used in the Water Source tab
    sodmglfinal: [{ value: 0, disabled: true }],
    sodcacofinal: [{ value: 0, disabled: true }],
    // Source 2 controls (start disabled)
    quantitywater2: [{ value: 0, disabled: true }],
    drpWaterSource2: [{ value: '', disabled: true }],
    SDIVal2: [{ value: '', disabled: true }],
    txtWaterTemperatute2: [{ value: 25, disabled: true }],
    pH2: [{ value: 7.5, disabled: true }],
    sodmgl2: [{ value: 0, disabled: true }],
    sodcaco2: [{ value: 0, disabled: true }],
    calmgl2: [{ value: 0, disabled: true }],
    calcaco2: [{ value: 0, disabled: true }],
    // Source 3 controls (start disabled)
    quantitywater3: [{ value: 0, disabled: true }],
    drpWaterSource3: [{ value: '', disabled: true }],
    SDIVal3: [{ value: '', disabled: true }],
    txtWaterTemperatute3: [{ value: 25, disabled: true }],
    pH3: [{ value: 7.5, disabled: true }],
    sodmgl3: [{ value: 0, disabled: true }],
    sodcaco3: [{ value: 0, disabled: true }],
    calmgl3: [{ value: 0, disabled: true }],
    calcaco3: [{ value: 0, disabled: true }],
         // Add controls for source 2 and 3 here...
         drpMembraneType: ['', Validators.required],
         txtFeedWaterInletPressure: [0, Validators.min(0)],
         txtNoOfPressureVesselsStage1: [0, [Validators.required, Validators.min(0)]],
         txtNoofElementsPerVesselStage1: [0, [Validators.required, Validators.min(1), Validators.max(8)]],
         txtBoostPressureStage1: [{ value: 0, disabled: true }],
         txtForcedPermeateBackPressure1: [0, Validators.min(0)],
         // Stage 2 controls (start disabled; enabled when drpNoOfProposedStages >= 2)
         txtNoOfPressureVesselsStage2: [{ value: 0, disabled: true }],
         txtNoofElementsPerVesselStage2: [{ value: 0, disabled: true }],
         txtBoostPressureStage2: [{ value: 0, disabled: true }],
         txtForcedPermeateBackPressure2: [{ value: 0, disabled: true }],
         // Stage 3 controls (start disabled; enabled when drpNoOfProposedStages === 3)
         txtNoOfPressureVesselsStage3: [{ value: 0, disabled: true }],
         txtNoofElementsPerVesselStage3: [{ value: 0, disabled: true }],
         txtBoostPressureStage3: [{ value: 0, disabled: true }],
         txtForcedPermeateBackPressure3: [{ value: 0, disabled: true }],
         txtFoulingFactor: [0.85, [Validators.required, Validators.min(0), Validators.max(1)]],
         ddlph: ['No'],
         ddlchem: [{ value: '0', disabled: true }],
         txtpHadj: [{ value: 7.5, disabled: true }, [Validators.min(0), Validators.max(14)]],
       });
   }

   // --- ngOnInit(), ngOnDestroy(), updateUnits(), calculateFlows(), handleStageVisibility(), handleWaterSourceVisibility(), updateCalculatedIonLoad(), onSubmit() are IDENTICAL ---
    ngOnInit(): void {
        // Clear any persisted/memoized match data on component init so a page reload
        // doesn't show a previously matched result.
        this.clearPersistedData();

        // Also ensure the runtime state starts clean
        this.foundResult = null;
        this.submitted = false;
        this.calculationMessage = '';

        // Add a beforeunload handler to remove any persisted keys when the user reloads/navigates away
        this._clearStorageListener = this.clearPersistedData.bind(this);
        window.addEventListener('beforeunload', this._clearStorageListener);

        this.dataService.getCsvData().subscribe(data => { this.csvData = data; });
        this.formChangesSubscription = this.projectionForm.valueChanges
        .pipe(debounceTime(300))
        .subscribe(values => {
            this.updateUnits(values);
            this.calculateFlows(values);
            this.handleStageVisibility(values);
            this.handleWaterSourceVisibility(values);
            this.updateCalculatedIonLoad();
        });
        this.calculateFlows(this.projectionForm.value);
        this.updateUnits(this.projectionForm.value);
    }

        ngOnDestroy(): void {
                if (this.formChangesSubscription) { this.formChangesSubscription.unsubscribe(); }
                // Remove the beforeunload listener if it was added
                try {
                    if (this._clearStorageListener) {
                        window.removeEventListener('beforeunload', this._clearStorageListener);
                        this._clearStorageListener = null;
                    }
                } catch (e) {
                    // ignore (window may not exist in some test environments)
                }
                // Ensure persisted data is cleared when component is destroyed
                this.clearPersistedData();
        }

        // Remove any keys that might persist a previously matched result so a full reload
        // always starts with a clean state. Keys are defensive — the app may not actually
        // store these, but removing them is harmless.
        private clearPersistedData(): void {
            try {
                localStorage.removeItem('foundResult');
                sessionStorage.removeItem('foundResult');
                localStorage.removeItem('matchedRow');
                sessionStorage.removeItem('matchedRow');
                localStorage.removeItem('csvData');
                sessionStorage.removeItem('csvData');
            } catch (e) {
                // ignore storage errors (e.g., in private mode or server-side rendering)
            }
        }

    updateUnits(values: any): void {
        this.flowUnit = values.drpflow || 'm³/hr';
        this.pressureUnit = values.drpPressure || 'bar';
        this.fluxUnit = values.drpFlux || 'lmh';
        this.temperatureUnit = values.drpTemperature || '°C';
    }

    calculateFlows(values: any): void {
        const desiredPermeate = Number(values.txtDesiredPermeateFlowRate) || 0;
        const recovery = Number(values.txtRecovery) || 0;

        if (recovery > 0 && recovery < 100) {
        const feedFlow = desiredPermeate / (recovery / 100);
        const concentrateFlow = feedFlow - desiredPermeate;
        this.projectionForm.patchValue({
            txtFeedFlow: parseFloat(feedFlow.toFixed(2)),
            txtConcentrateFlow: parseFloat(concentrateFlow.toFixed(2))
        }, { emitEvent: false }); // Avoid triggering valueChanges again
        } else {
        this.projectionForm.patchValue({
            txtFeedFlow: 0,
            txtConcentrateFlow: 0
        }, { emitEvent: false });
        }
    }

     handleStageVisibility(values: any): void {
        this.selectedStages = Number(values.drpNoOfProposedStages) || 1;
        // Enable/disable stage 2/3 controls based on this.selectedStages
        const stage2Vessels = this.projectionForm.get('txtNoOfPressureVesselsStage2');
        const stage2Elements = this.projectionForm.get('txtNoofElementsPerVesselStage2');
        // Add other stage 2/3 controls here
        const stage3Vessels = this.projectionForm.get('txtNoOfPressureVesselsStage3');
        const stage3Elements = this.projectionForm.get('txtNoofElementsPerVesselStage3');


        if (this.selectedStages >= 2) {
           stage2Vessels?.enable({ emitEvent: false });
           // Add validators for stage2 elements when enabling
           stage2Elements?.enable({ emitEvent: false });
           stage2Elements?.setValidators([Validators.required, Validators.min(1), Validators.max(8)]);
           stage2Elements?.updateValueAndValidity({ emitEvent: false });
             // Enable others...
        } else {
           stage2Vessels?.disable({ emitEvent: false });
           // Remove validators and reset when disabling
           stage2Elements?.clearValidators();
           stage2Elements?.updateValueAndValidity({ emitEvent: false });
           stage2Elements?.disable({ emitEvent: false });
              // Disable others...
        }
        if (this.selectedStages >= 3) {
          stage3Vessels?.enable({ emitEvent: false });
          stage3Elements?.enable({ emitEvent: false });
          stage3Elements?.setValidators([Validators.required, Validators.min(1), Validators.max(8)]);
          stage3Elements?.updateValueAndValidity({ emitEvent: false });
             // Enable others...
        } else {
          stage3Vessels?.disable({ emitEvent: false });
          stage3Elements?.clearValidators();
          stage3Elements?.updateValueAndValidity({ emitEvent: false });
          stage3Elements?.disable({ emitEvent: false });
             // Disable others...
        }
     }

     handleWaterSourceVisibility(values: any): void {
       this.selectedWaterSources = Number(values.noofwatersource) || 1;
       // Example for source 2 controls
       const quantity2 = this.projectionForm.get('quantitywater2');
       const drpWaterSource2 = this.projectionForm.get('drpWaterSource2');
       // ... get ALL other source 2 controls

       if (this.selectedWaterSources >= 2) {
         quantity2?.enable({ emitEvent: false });
         drpWaterSource2?.enable({ emitEvent: false });
         // ... enable others
       } else {
         quantity2?.disable({ emitEvent: false });
         quantity2?.setValue(0, { emitEvent: false }); // Reset
         drpWaterSource2?.disable({ emitEvent: false });
          drpWaterSource2?.setValue('', { emitEvent: false }); // Reset
         // ... disable and reset others
       }

       // Repeat for source 3 controls
       const quantity3 = this.projectionForm.get('quantitywater3');
       const drpWaterSource3 = this.projectionForm.get('drpWaterSource3');
        // ... get ALL other source 3 controls
       if (this.selectedWaterSources >= 3) {
          quantity3?.enable({ emitEvent: false });
          drpWaterSource3?.enable({ emitEvent: false });
           // ... enable others
       } else {
          quantity3?.disable({ emitEvent: false });
          quantity3?.setValue(0, { emitEvent: false }); // Reset
          drpWaterSource3?.disable({ emitEvent: false });
           drpWaterSource3?.setValue('', { emitEvent: false }); // Reset
           // ... disable and reset others
       }
     }

      updateCalculatedIonLoad(): void {
         const vals = this.projectionForm.getRawValue(); // Use getRawValue to include disabled controls if needed
         let finalValues: any = {};

         if (this.selectedWaterSources === 1) {
             // Use source 1 directly
             finalValues = {
                 sodmgl: vals.sodmgl1, sodcaco: vals.sodcaco1,
                 calmgl: vals.calmgl1, calcaco: vals.calcaco1,
                 // ... copy all other ions from source 1 ...
                 pH: vals.pH1,
                 txtWaterTemperatute: vals.txtWaterTemperatute1,
                 // SDI requires mapping the '<' values, handle separately for display
                 // drpWaterSource: vals.drpWaterSource1 // Source type needs calculation if mixed
             };
              finalValues['drpWaterSource'] = vals.drpWaterSource1; // Copy source type
              finalValues['SDIVal'] = vals.SDIVal1; // Copy SDI value
         } else {
             // Calculate weighted average
             const q1 = Number(vals.quantitywater1) || 0;
             const q2 = Number(vals.quantitywater2) || 0;
             const q3 = Number(vals.quantitywater3) || 0;
             const totalQ = q1 + q2 + q3;

             if (totalQ > 0) {
                 finalValues = {
                     sodmgl: ((Number(vals.sodmgl1) || 0) * q1 + (Number(vals.sodmgl2) || 0) * q2 + (Number(vals.sodmgl3) || 0) * q3) / totalQ,
                     sodcaco: ((Number(vals.sodcaco1) || 0) * q1 + (Number(vals.sodcaco2) || 0) * q2 + (Number(vals.sodcaco3) || 0) * q3) / totalQ,
                     calmgl: ((Number(vals.calmgl1) || 0) * q1 + (Number(vals.calmgl2) || 0) * q2 + (Number(vals.calmgl3) || 0) * q3) / totalQ,
                     calcaco: ((Number(vals.calcaco1) || 0) * q1 + (Number(vals.calcaco2) || 0) * q2 + (Number(vals.calcaco3) || 0) * q3) / totalQ,
                     // ... calculate weighted average for ALL other ions ...
                     pH: ((Number(vals.pH1) || 0) * q1 + (Number(vals.pH2) || 0) * q2 + (Number(vals.pH3) || 0) * q3) / totalQ, // Simple average for pH, might need log scale avg?
                     txtWaterTemperatute: ((Number(vals.txtWaterTemperatute1) || 0) * q1 + (Number(vals.txtWaterTemperatute2) || 0) * q2 + (Number(vals.txtWaterTemperatute3) || 0) * q3) / totalQ,
                 };
                  // Determine final SDI (take the highest value)
                 finalValues['SDIVal'] = Math.max(Number(vals.SDIVal1) || 0, Number(vals.SDIVal2) || 0, Number(vals.SDIVal3) || 0);
                 // Determine final source type (logic needed - e.g., if any Waste Water, it's Waste Water?)
                 finalValues['drpWaterSource'] = 'Mixed'; // Placeholder
             } else {
                // Handle zero total quantity case
             }
         }
            // Patch the calculated final values to the controls used in the Ion Load tab
            this.projectionForm.patchValue({
                sodmgl: finalValues.sodmgl, sodcaco: finalValues.sodcaco,
                calmgl: finalValues.calmgl, calcaco: finalValues.calcaco,
                // ... patch all other ions ...
                pH: finalValues.pH,
                txtWaterTemperatute: finalValues.txtWaterTemperatute,
                SDIVal: finalValues.SDIVal,
                drpWaterSource: finalValues.drpWaterSource
                // Note: The 'final' display fields in the Water Source tab are NOT form controls,
                // you'll need separate component properties to bind to them in the HTML
            }, { emitEvent: false });
      }

    onSubmit(): void {
        this.submitted = true;
        this.foundResult = null;
        this.calculationMessage = '';

        if (this.projectionForm.invalid) {
            this.calculationMessage = 'Please fill all required fields correctly.';
            // Provide detailed diagnostics for invalid controls
            const invalids = this.listInvalidControls();
            console.log("Form Errors:", this.getFormValidationErrors());
            console.log("Detailed invalid controls:", invalids);
            // Show a brief message listing the invalid control names to help the user
            const invalidNames = invalids.map(i => i.name).slice(0, 10);
            if (invalidNames.length) {
                this.calculationMessage = 'Please correct these fields: ' + invalidNames.join(', ');
            }
            return;
        }

        const formValues = this.projectionForm.getRawValue();

        // Use exact CSV headers for matching
         // Use the exact CSV header names from master.csv and remove Water Source (not present in CSV)
         const keyParamsToMatch = {
             'Feed Flow (m3/hr)': parseFloat(formValues.txtFeedFlow.toFixed(2)),
             'Recovery(%)': parseFloat(formValues.txtRecovery.toFixed(2)),
             'Feed Temperature': parseFloat(formValues.txtWaterTemperatute1.toFixed(2)),
             'Feed water pH': parseFloat(formValues.pH1.toFixed(2))
         };


        console.log("Attempting to match:", keyParamsToMatch);
        this.calculationMessage = 'Searching for matching projection...';

        // Ensure CSV is loaded
        if (!this.csvData || !Array.isArray(this.csvData) || this.csvData.length === 0) {
            console.warn('CSV data not loaded yet or is empty.');
            this.calculationMessage = 'Data not available yet. Please wait for the CSV to load and try again.';
            return;
        }

        // Build a normalized header map so small header differences won't break matching
        const csvHeaders = Object.keys(this.csvData[0] || {});
        const normalize = (s: any) => {
            if (s === null || s === undefined) return '';
            let t = String(s);
            // Replace common unicode/symbol variants
            t = t.replace(/³/g, '3');
            t = t.replace(/°/g, '');
            t = t.replace(/µ/g, 'u');
            // Replace slash style units and braces, then remove non-alphanum
            t = t.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            return t;
        };

        const headerMap: { [norm: string]: string } = {};
        csvHeaders.forEach(h => headerMap[normalize(h)] = h);

        // Tokenize helper for improved fuzzy matching (handles word reordering / extra words)
        const tokens = (s: string) => {
            return normalize(s).match(/[a-z0-9]+/g) || [];
        };

        // Precompute header token sets
        const headerTokens: { hdr: string; tokens: string[] }[] = csvHeaders.map(h => ({ hdr: h, tokens: tokens(h) }));

        // Try to map each required key to a CSV header using token-subset matching
        const keyToHeader: { [key: string]: string | null } = {};
        const missingColumns: string[] = [];
        for (const key of Object.keys(keyParamsToMatch)) {
            const keyTokens = tokens(key);
            // Exact normalized match first
            let matched = headerMap[normalize(key)];
            if (!matched) {
                // Find header where all key tokens are present in header tokens (subset)
                const found = headerTokens.find(h => {
                    const hset = new Set(h.tokens);
                    return keyTokens.every(t => hset.has(t));
                });
                if (found) matched = found.hdr;
            }
            if (!matched) {
                // As a last resort, allow header tokens subset of key tokens
                const found2 = headerTokens.find(h => {
                    const kset = new Set(keyTokens);
                    return h.tokens.every(t => kset.has(t));
                });
                if (found2) matched = found2.hdr;
            }
            if (!matched) {
                missingColumns.push(key);
                keyToHeader[key] = null;
            } else {
                keyToHeader[key] = matched;
            }
        }

        if (missingColumns.length) {
            console.error('CSV is missing required columns:', missingColumns);
            this.calculationMessage = 'CSV missing columns: ' + missingColumns.join(', ');
            return;
        }

        // Helper comparators
        const numericTolerance = 0.01;
        const equalCompare = (formValue: any, csvValue: any) => {
            if (formValue === null || formValue === undefined) return false;
            if (typeof formValue === 'number') {
                const csvNum = Number(csvValue);
                return !isNaN(csvNum) && Math.abs(formValue - csvNum) <= numericTolerance;
            }
            // String comparison (case-insensitive, trim)
            return String(formValue).toString().trim().toLowerCase() === String(csvValue).toString().trim().toLowerCase();
        };

        // Try to find a single row where ALL key params match using the mapped headers
        const matchedRows = this.csvData.filter(row => {
            for (const key of Object.keys(keyParamsToMatch)) {
                const formValue = keyParamsToMatch[key as keyof typeof keyParamsToMatch];
                const headerName = keyToHeader[key];
                if (!headerName) return false;
                const csvValue = row[headerName];
                if (csvValue === undefined || csvValue === null) return false;
                if (!equalCompare(formValue, csvValue)) return false;
            }
            return true;
        });

        if (matchedRows.length > 0) {
            // When multiple rows match the search keys we 1) expose all candidates so the
            // UI can show them and allow selection, and 2) create a safe aggregated
            // mapping (numeric fields averaged) so the app can continue automatically.

            // Map a raw CSV row into the mapped object used by ResultsDisplay
            const headerToKey = (h: string) => {
                if (!h) return '';
                let k = String(h).toLowerCase();
                k = k.replace(/³/g, '3').replace(/°/g, '').replace(/µ/g, 'u');
                k = k.replace(/[\/\*(),]+/g, '_');
                k = k.replace(/\s+/g, '_');
                k = k.replace(/__+/g, '_');
                k = k.replace(/^_+|_+$/g, '');
                return k;
            };

            const mapRaw = (raw: any) => {
                const mapped: any = {};
                for (const h of Object.keys(raw)) {
                    const key = headerToKey(h);
                    mapped[key] = raw[h];
                    const alt = key.replace(/%/g, '').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
                    if (alt && alt !== key) mapped[alt] = raw[h];
                    mapped[h] = raw[h];
                }
                mapped.__raw = raw;
                mapped.__matched_at = new Date().toISOString();
                return mapped;
            };

            // Build candidate list
            this.foundCandidates = matchedRows.map(r => mapRaw(r));

            // If only one candidate, use it. If multiple, compute an aggregated candidate
            if (this.foundCandidates.length === 1) {
                this.foundResult = { ...this.foundCandidates[0] };
                this.aggregatedResult = null;
                this.calculationMessage = 'Matching projection found.';
                console.log('Found single candidate:', this.foundResult);
                return;
            }

            // Multiple candidates: create an aggregated mapping that averages numeric columns
            const aggregate = (rows: any[]) => {
                // Collect header names from raw rows
                const headers = Object.keys(rows[0].__raw || {});
                const aggRaw: any = {};
                for (const h of headers) {
                    const vals = rows.map(r => r.__raw[h]).filter(v => v !== undefined && v !== null && v !== '');
                    // Try numeric average where possible
                    const nums = vals.map(v => Number(v)).filter(n => !isNaN(n));
                    if (nums.length === vals.length && nums.length > 0) {
                        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
                        aggRaw[h] = parseFloat(avg.toFixed(4));
                    } else {
                        // Fall back to the most common string value
                        const counts: any = {};
                        for (const v of vals) counts[String(v)] = (counts[String(v)] || 0) + 1;
                        const entries = Object.entries(counts);
                        if (entries.length) {
                            entries.sort((a: any, b: any) => b[1] - a[1]);
                            aggRaw[h] = entries[0][0];
                        } else {
                            aggRaw[h] = '';
                        }
                    }
                }
                const mappedAgg = mapRaw(aggRaw);
                mappedAgg.__aggregated_from = rows.length;
                return mappedAgg;
            };

            this.aggregatedResult = aggregate(this.foundCandidates);
            // Do not default to aggregated result; wait for user selection
            this.foundResult = null;
            this.calculationMessage = `Multiple matching projections found (${this.foundCandidates.length}). Please select a row to view the SMART Projection Result.`;
            console.log('Found multiple candidates, waiting for selection. Candidates:', this.foundCandidates.length);
            return;
        }

        // No single-row match: check whether each input value exists anywhere in its mapped CSV column
        const missingInputs: string[] = [];
        for (const key of Object.keys(keyParamsToMatch)) {
            const formValue = keyParamsToMatch[key as keyof typeof keyParamsToMatch];
            const headerName = keyToHeader[key];
            if (!headerName) { missingInputs.push(key); continue; }
            const existsSomewhere = this.csvData.some(row => {
                const csvValue = row[headerName];
                if (csvValue === undefined || csvValue === null) return false;
                return equalCompare(formValue, csvValue);
            });
            if (!existsSomewhere) missingInputs.push(key);
        }

        if (missingInputs.length === 0) {
            // Each input exists in the CSV somewhere, but not in the same row
            console.info('All input values appear in CSV columns, but no single row contained them all.');
            this.calculationMessage = 'No single matching projection found, but each input value exists somewhere in the CSV.';
        } else {
            console.log('No matching record found. Missing inputs in CSV:', missingInputs);
            this.calculationMessage = 'No matching projection found. The following inputs were not present in the CSV: ' + missingInputs.join(', ');
        }
    }

    // Allow clearing the current found result from the UI/state
    clearResult(): void {
        this.foundResult = null;
        this.submitted = false;
        this.calculationMessage = '';
        // Clear any candidate/aggregation state we may have built
        this.foundCandidates = [];
        this.aggregatedResult = null;
        // Also clear any persisted placeholders just in case
        this.clearPersistedData();
        console.log('Result cleared by user.');
    }

    // Allow selecting a specific candidate row (index into foundCandidates)
    // selectCandidate(index: number): void {
    //     if (!Array.isArray(this.foundCandidates) || index < 0 || index >= this.foundCandidates.length) return;
    //     this.foundResult = this.foundCandidates[index];
    //     this.calculationMessage = `Using selected candidate ${index + 1} of ${this.foundCandidates.length}.`;
    //     // When user explicitly selects, we no longer need aggregated default
    //     this.aggregatedResult = null;
    //     console.log('User selected candidate:', index, this.foundResult);
    // }
    // in component/projection.ts file

selectCandidate(index: number): void {
    if (!Array.isArray(this.foundCandidates) || index < 0 || index >= this.foundCandidates.length) return;

    this.foundResult = { ...this.foundCandidates[index] };

    // 🔥 CRITICAL UPDATE: Assign the selected candidate to the 'result' property
    // that the HTML template is currently using.
    this.result = this.foundResult; // <--- ADD/CONFIRM THIS LINE

    this.calculationMessage = `Using selected candidate ${index + 1} of ${this.foundCandidates.length}.`;
    // When user explicitly selects, we no longer need aggregated default
    this.aggregatedResult = null;
    // Clear candidates to hide the selection table after selection
    this.foundCandidates = [];
    console.log('User selected candidate:', index, this.foundResult);

    // Trigger change detection to update the view
    this.cdr.detectChanges();
}


   // Helper to see validation errors
   getFormValidationErrors(): any[] {
     const errors: any[] = [];
     Object.keys(this.projectionForm.controls).forEach(key => {
       const control = this.projectionForm.get(key); // Get the AbstractControl
       // Check if control exists and has errors
       if (control && control.errors) {
         errors.push({ control: key, errors: control.errors });
       }
     });
     return errors; // <-- Added return statement
   }

     // Recursively list invalid controls with status, value and errors to aid debugging
     listInvalidControls(): Array<{ name: string; status: string; value: any; errors: any }> {
         const invalids: Array<{ name: string; status: string; value: any; errors: any }> = [];

         const recurse = (ctrls: { [key: string]: AbstractControl }, parent: string | null = null) => {
             Object.keys(ctrls).forEach(key => {
                 const control = ctrls[key];
                 const path = parent ? `${parent}.${key}` : key;
                 // If this control is a nested group, drill into it
                 const childControls = (control as any).controls;
                 if (childControls && typeof childControls === 'object') {
                     recurse(childControls, path);
                 } else {
                     // Only report controls that are enabled and invalid
                     if (control && control.enabled && control.invalid) {
                         invalids.push({ name: path, status: control.status, value: control.value, errors: control.errors });
                     }
                 }
             });
         };

         recurse(this.projectionForm.controls);
         return invalids;
     }
}