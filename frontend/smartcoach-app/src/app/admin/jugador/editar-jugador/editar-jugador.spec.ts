import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarJugador } from './editar-jugador';

describe('EditarJugador', () => {
  let component: EditarJugador;
  let fixture: ComponentFixture<EditarJugador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarJugador],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarJugador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
