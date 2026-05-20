import { TestBed } from '@angular/core/testing';

import { JugadorClassification } from './jugador-classification';

describe('JugadorClassification', () => {
  let service: JugadorClassification;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JugadorClassification);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
