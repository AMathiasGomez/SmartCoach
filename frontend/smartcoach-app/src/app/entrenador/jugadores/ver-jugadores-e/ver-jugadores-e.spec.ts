import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerJugadoresE } from './ver-jugadores-e';

describe('VerJugadoresE', () => {
  let component: VerJugadoresE;
  let fixture: ComponentFixture<VerJugadoresE>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerJugadoresE],
    }).compileComponents();

    fixture = TestBed.createComponent(VerJugadoresE);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
