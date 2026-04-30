import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleEntrenamiento } from './detalle-entrenamiento';

describe('DetalleEntrenamiento', () => {
  let component: DetalleEntrenamiento;
  let fixture: ComponentFixture<DetalleEntrenamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleEntrenamiento],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEntrenamiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
