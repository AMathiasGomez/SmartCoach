import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerPartidosE } from './ver-partidos-e';

describe('VerPartidosE', () => {
  let component: VerPartidosE;
  let fixture: ComponentFixture<VerPartidosE>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPartidosE],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPartidosE);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
