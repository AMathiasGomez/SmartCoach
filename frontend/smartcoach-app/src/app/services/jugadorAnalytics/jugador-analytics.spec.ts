import { TestBed } from '@angular/core/testing';

import { JugadorAnalytics } from '../jugador-analytics';

describe('JugadorAnalytics', () => {
  let service: JugadorAnalytics;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JugadorAnalytics);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
