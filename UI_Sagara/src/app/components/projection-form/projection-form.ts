import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(private fb: FormBuilder, private dataService: DataService) {
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
         const keyParamsToMatch = {
             'Feed flow (m³/h)': parseFloat(formValues.txtFeedFlow.toFixed(2)),
             'Recovery (%)': parseFloat(formValues.txtRecovery.toFixed(2)),
             'Feed temperature (°C)': parseFloat(formValues.txtWaterTemperatute1.toFixed(2)),
             'Feed pH': parseFloat(formValues.pH1.toFixed(2)),
             'Water Source': formValues.drpWaterSource1
         };


        console.log("Attempting to match:", keyParamsToMatch);
        this.calculationMessage = 'Searching for matching projection...';

        this.foundResult = this.csvData.find(row => {
            let match = true;
            for (const key in keyParamsToMatch) {
                const formValue = keyParamsToMatch[key as keyof typeof keyParamsToMatch];
                const csvValue = row[key]; // Use cleaned key

                if (csvValue === undefined || csvValue === null) {
                    // console.warn(`CSV column "${key}" not found or null in row.`);
                    // Decide if missing value means no match or skip check
                     // If the key param MUST exist, uncomment below:
                     // match = false;
                     // break;
                     continue; // Skip check if column is missing/null in this row
                }

                // Numeric comparison with tolerance
                if (typeof formValue === 'number') {
                    const csvNum = Number(csvValue);
                     if (isNaN(csvNum) || Math.abs(formValue - csvNum) > 0.01) { // Tolerance of 0.01
                         // console.log(`Mismatch ${key}: Form=${formValue}, CSV=${csvValue}`);
                        match = false;
                        break;
                    }
                }
                 // Add specific string/other comparisons if needed
                 else if (formValue !== csvValue) {
                     // console.log(`Mismatch ${key}: Form=${formValue}, CSV=${csvValue}`);
                     match = false;
                     break;
                 }
            }
            return match;
        });

        if (this.foundResult) {
            console.log('Found Result:', this.foundResult);
            this.calculationMessage = 'Matching projection found.';
        } else {
            console.log('No matching record found for:', keyParamsToMatch);
            this.calculationMessage = 'No matching projection found in the data for the specified key inputs.';
        }
    }

    // Allow clearing the current found result from the UI/state
    clearResult(): void {
        this.foundResult = null;
        this.submitted = false;
        this.calculationMessage = '';
        // Also clear any persisted placeholders just in case
        this.clearPersistedData();
        console.log('Result cleared by user.');
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
