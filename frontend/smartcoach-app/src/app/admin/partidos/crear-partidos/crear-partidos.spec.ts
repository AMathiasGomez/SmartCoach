import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPartidos } from './crear-partidos';

describe('CrearPartidos', () => {
  let component: CrearPartidos;
  let fixture: ComponentFixture<CrearPartidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPartidos],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPartidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
