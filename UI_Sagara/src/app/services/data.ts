import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Papa from 'papaparse';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private http: HttpClient) { }
  getCsvData(): Observable<any[]> {
     return this.http.get('assets/data/master.csv', { responseType: 'text' })
       .pipe(
         map(csvString => {
           const config = {
             header: true,
             skipEmptyLines: true,
             dynamicTyping: true
           };
           const parsedData = Papa.parse(csvString, config);

           if (parsedData.errors.length > 0) {
              console.error("CSV Parsing Errors:", parsedData.errors);
           }
           // Use original CSV headers without cleaning
           console.log('CSV Headers:', Object.keys(parsedData.data[0] || {}));
           return parsedData.data;
         })
       );
   }
}
