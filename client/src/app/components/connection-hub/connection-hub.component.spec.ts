import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConnectionHubComponent } from './connection-hub.component';

describe('ConnectionHubComponent', () => {
  let component: ConnectionHubComponent;
  let fixture: ComponentFixture<ConnectionHubComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ConnectionHubComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
