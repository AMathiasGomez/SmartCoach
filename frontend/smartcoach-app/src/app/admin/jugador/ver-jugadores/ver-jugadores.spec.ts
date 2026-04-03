import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerJugadores } from './ver-jugadores';

describe('VerJugadores', () => {
  let component: VerJugadores;
  let fixture: ComponentFixture<VerJugadores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerJugadores],
    }).compileComponents();

    fixture = TestBed.createComponent(VerJugadores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
