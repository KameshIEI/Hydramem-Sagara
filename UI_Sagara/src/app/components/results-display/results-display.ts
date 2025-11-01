import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [ CommonModule ],
  providers: [ DecimalPipe ],
  templateUrl: './results-display.html',
  styleUrls: ['./results-display.css']
})
export class ResultsDisplay {
   @Input() result: any = null;  // Currently selected result
   @Input() candidates: any[] = [];  // All matching results
   @Input() submitted: boolean = false;
   @Input() projectName: string = '';
   @Input() designerName: string = '';
   @Input() flowUnit: string = 'm³/hr';
   @Input() pressureUnit: string = 'bar';
   @Input() fluxUnit: string = 'lmh';
   @Input() temperatureUnit: string = '°C';
   currentDate: string = new Date().toLocaleDateString();
   
   @Output() selectCandidate = new EventEmitter<number>();  // Emit index when a result is selected

   // Helper method to get raw headers
   getRawHeaders(): string[] {
     if (!this.result || !this.result.__raw) return [];
     return Object.keys(this.result.__raw);
   }

   // Format values with decimal pipe
   formatValue(v: any): string {
     if (v === null || v === undefined || v === '') return '-';
     if (typeof v === 'number') {
       const formatted = this.decimalPipe.transform(v, '1.2-2');
       return formatted || String(v);
     }
     const n = Number(v);
     if (!isNaN(n)) {
       const formatted = this.decimalPipe.transform(n, '1.2-2');
       return formatted || String(v);
     }
     return String(v);
   }

   constructor(private decimalPipe: DecimalPipe) {}

   getStageValue(stage: number, key: string) { /* ... same code ... */ }

   // Method to get all variables from the result
   getAllVariables(): { key: string; value: any }[] {
     if (!this.result || !this.result.__raw) return [];

     // Map the keys and values from the __raw object into an array of objects
     return Object.keys(this.result.__raw).map(key => ({
       key: key,
       value: this.result.__raw[key]
     }));
   }
}