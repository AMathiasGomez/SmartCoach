import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePartido } from './detalle-partido';

describe('DetallePartido', () => {
  let component: DetallePartido;
  let fixture: ComponentFixture<DetallePartido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePartido],
    }).compileComponents();

    fixture = TestBed.createComponent(DetallePartido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
