import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerEntrenamientosE } from './ver-entrenamientos-e';

describe('VerEntrenamientosE', () => {
  let component: VerEntrenamientosE;
  let fixture: ComponentFixture<VerEntrenamientosE>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerEntrenamientosE],
    }).compileComponents();

    fixture = TestBed.createComponent(VerEntrenamientosE);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
