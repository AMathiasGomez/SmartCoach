import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerEquipos } from './ver-equipos';

describe('VerEquipos', () => {
  let component: VerEquipos;
  let fixture: ComponentFixture<VerEquipos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerEquipos],
    }).compileComponents();

    fixture = TestBed.createComponent(VerEquipos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
