import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleJugador } from './detalle-jugador';

describe('DetalleJugador', () => {
  let component: DetalleJugador;
  let fixture: ComponentFixture<DetalleJugador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleJugador],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleJugador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
