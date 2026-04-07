import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPartido } from './editar-partido';

describe('EditarPartido', () => {
  let component: EditarPartido;
  let fixture: ComponentFixture<EditarPartido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPartido],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPartido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
