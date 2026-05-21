import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarEntrenamiento } from './editar-entrenamiento';

describe('EditarEntrenamiento', () => {
  let component: EditarEntrenamiento;
  let fixture: ComponentFixture<EditarEntrenamiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarEntrenamiento],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarEntrenamiento);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
