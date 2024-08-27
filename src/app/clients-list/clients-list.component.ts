import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { UtilityService } from '../utility/utility.service';
import { Client, PageAndFilterParams } from '../interfaces/client.interface';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ClientFormComponent } from '../client-form/client-form.component';
import { ActionNames } from '../interfaces/actions';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { filter, Observable, of, switchMap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FiltersList } from '../interfaces/filters.interface';


@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatPaginatorModule, MatSelectModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './clients-list.component.html',
  styleUrl: './clients-list.component.scss'
})
export class ClientsListComponent implements OnInit, OnDestroy {

  filtersActive: boolean = false;
  displayedColumns: string[] = ['name', 'lastName', 'sex', 'pin', 'actions'];
  dataSource: Client[] = [];
  pageSize: number = 5;
  pageIndex: number = 0;
  fullLength: number = 0;
  pageAndFilterParams$!: Observable<PageAndFilterParams[]>;
  filters!: FiltersList;

  filterForm = this.formBuilder.group({
    name: [''],
    lastName: [''],
    sex: [''],
  })

  constructor(
    private utilityService: UtilityService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private formBuilder: FormBuilder
  ) {

  }

  ngOnInit(): void {
    this.getFullClients();
    this.getRoutingParams();
    this.utilityService.clientUpdated.subscribe(() => this.getClients())
  }

  ngOnDestroy(): void {
    this.utilityService.clientUpdated.unsubscribe();
  }

  getRoutingParams() {
    this.route.paramMap.subscribe(params => {
      this.filters = {name: params.get('name') as string, lastName: params.get('lastName') as string, sex: params.get('sex') as string}
      this.filtersActive = !!(params.get('name') || params.get('lastName') || params.get('sex'));
      this.filterForm.patchValue(this.filters);
      this.pageIndex = Number(params.get('page')) | 0;
      this.pageSize = Number(params.get('per_page')) | 5;
      this.getClients();
    })
   
    
  }

  addData() {
    const dialogRef = this.dialog.open(ClientFormComponent, {
      data: {
        action: ActionNames.Add
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  editClient(clientId: number) {
    const dialogRef = this.dialog.open(ClientFormComponent, {
      data: {
        action: ActionNames.Edit,
        id: clientId
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  removeData() {
  }

  getFullClients() {
    this.utilityService.getData<Client[]>('clients?').subscribe(res => {
      this.fullLength = res.length;
    })
  }

  getClients() {
    let filters = (this.filters.name ? `name=${this.filters.name}&` : '') + (this.filters.lastName ? `lastName=${this.filters.lastName}&` : '') + (this.filters.sex ? `sex=${this.filters.sex}&` : '');
    let pageAndFilters = `${filters}_start=${this.pageIndex * this.pageSize}&_limit=${this.pageSize}` ;
    this.utilityService.getData<Client[]>('clients?' + pageAndFilters).subscribe(res => {
      this.dataSource = res;
    })
  }

  openDetails(clientId: number) {
    this.router.navigate(['./details', { id: clientId }], { relativeTo: this.route })
  }

  async deleteClient(clientId: number) {
    this.utilityService.deleteData(`clients/${clientId}`).subscribe(() => {
      this.router.navigate(['../'], { relativeTo: this.route })
      this.getClients();
    });
  }

  handlePageEvent(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.router.navigate(['./', { page: this.pageIndex, per_page: this.pageSize }], { relativeTo: this.route })
  }
  
  applyFilters() {
    this.pageIndex = 0;
    let tempFilters = {
      ...(this.filterForm.get('name')?.value) && {name: this.filterForm.get('name')?.value},
      ...(this.filterForm.get('lastName')?.value) && {lastName: this.filterForm.get('lastName')?.value},
      ...(this.filterForm.get('sex')?.value) && {sex: this.filterForm.get('sex')?.value},
    }
    
    this.router.navigate(['./', { page: this.pageIndex, per_page: this.pageSize, ...tempFilters }], { relativeTo: this.route })
  }

  clearFilters() {
    this.filters = {name: '', lastName: '', sex: ''};
    this.filterForm.reset();
    this.router.navigate(['./', { page: this.pageIndex, per_page: this.pageSize}], { relativeTo: this.route })
  }

}
