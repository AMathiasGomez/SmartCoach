import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleEquipo } from './detalle-equipo';

describe('DetalleEquipo', () => {
  let component: DetalleEquipo;
  let fixture: ComponentFixture<DetalleEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
