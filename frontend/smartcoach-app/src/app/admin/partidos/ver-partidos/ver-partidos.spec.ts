import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerPartidos } from './ver-partidos';

describe('VerPartidos', () => {
  let component: VerPartidos;
  let fixture: ComponentFixture<VerPartidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPartidos],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPartidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
