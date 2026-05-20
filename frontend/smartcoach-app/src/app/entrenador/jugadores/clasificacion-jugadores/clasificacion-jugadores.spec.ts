import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClasificacionJugadores } from './clasificacion-jugadores';

describe('ClasificacionJugadores', () => {
  let component: ClasificacionJugadores;
  let fixture: ComponentFixture<ClasificacionJugadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClasificacionJugadores],
    }).compileComponents();

    fixture = TestBed.createComponent(ClasificacionJugadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
