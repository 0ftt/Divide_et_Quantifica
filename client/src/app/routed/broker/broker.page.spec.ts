import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrokerPage } from './broker.page';

describe('BrokerPage', () => {
  let component: BrokerPage;
  let fixture: ComponentFixture<BrokerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BrokerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
