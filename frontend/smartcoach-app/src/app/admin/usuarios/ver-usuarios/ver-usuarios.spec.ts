import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerUsuarios } from './ver-usuarios';

describe('VerUsuarios', () => {
  let component: VerUsuarios;
  let fixture: ComponentFixture<VerUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerUsuarios],
    }).compileComponents();

    fixture = TestBed.createComponent(VerUsuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
