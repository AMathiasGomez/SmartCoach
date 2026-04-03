import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerEntrenamientos } from './ver-entrenamientos';

describe('VerEntrenamientos', () => {
  let component: VerEntrenamientos;
  let fixture: ComponentFixture<VerEntrenamientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerEntrenamientos],
    }).compileComponents();

    fixture = TestBed.createComponent(VerEntrenamientos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
