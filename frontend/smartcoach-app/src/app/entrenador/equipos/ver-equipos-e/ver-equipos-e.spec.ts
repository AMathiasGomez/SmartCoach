import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerEquiposE } from './ver-equipos-e';

describe('VerEquiposE', () => {
  let component: VerEquiposE;
  let fixture: ComponentFixture<VerEquiposE>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerEquiposE],
    }).compileComponents();

    fixture = TestBed.createComponent(VerEquiposE);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
