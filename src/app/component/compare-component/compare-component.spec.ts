import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareComponent } from './compare-component';

describe('CompareComponent', () => {
  let component: CompareComponent;
  let fixture: ComponentFixture<CompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompareComponent],
      providers: [provideZonelessChangeDetection()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
