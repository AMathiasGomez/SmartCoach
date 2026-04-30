import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearJugador } from './crear-jugador';

describe('CrearJugador', () => {
  let component: CrearJugador;
  let fixture: ComponentFixture<CrearJugador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearJugador],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearJugador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
