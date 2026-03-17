import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDirectivo } from './dashboard-directivo';

describe('DashboardDirectivo', () => {
  let component: DashboardDirectivo;
  let fixture: ComponentFixture<DashboardDirectivo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardDirectivo],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardDirectivo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
