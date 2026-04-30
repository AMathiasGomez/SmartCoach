import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEntrenamiento } from './crear-entrenamiento';

describe('CrearEntrenamiento', () => {
  let component: CrearEntrenamiento;
  let fixture: ComponentFixture<CrearEntrenamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEntrenamiento],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearEntrenamiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
