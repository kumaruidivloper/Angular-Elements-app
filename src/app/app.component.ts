import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { MessageBusService } from '../shared/services/message-bus.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Host Application';
  messages: any[] = [];
  userInfo = { name: 'Kumar Shan', role: 'Admin' };
  private subscriptions: Subscription[] = [];

  constructor(private messageBus: MessageBusService, private cdr: ChangeDetectorRef,
    private ngZone: NgZone) {}

  ngOnInit() {
    // Set initial shared state
    this.messageBus.setState('userInfo', this.userInfo);
    this.messageBus.setState('theme', 'light');

    // Listen to all MFE events
    const allEventsSubscription = this.messageBus.getAllEvents().subscribe(event => {
      this.messages.unshift({
        ...event,
        timeString: new Date(event.timestamp).toLocaleTimeString()
      });
      
      // Keep only last 10 messages for display
      if (this.messages.length > 10) {
        this.messages = this.messages.slice(0, 10);
      }
      this.cdr.detectChanges();
    });

    // Listen to specific events from MFEs
    const mfeEventsSubscription = this.messageBus.on('MFE_LOADED').subscribe(event => {
      console.log('MFE Loaded:', event.payload);
      this.cdr.detectChanges();
    });

    const dataRequestSubscription = this.messageBus.on('REQUEST_DATA').subscribe(event => {
      // Respond to data requests from MFEs
      this.messageBus.emit('DATA_RESPONSE', {
        requestId: event.payload.requestId,
        data: this.getUserData()
      });
      this.cdr.detectChanges();
    });

    this.subscriptions.push(allEventsSubscription, mfeEventsSubscription, dataRequestSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private getUserData() {
    return {
      users: [
        { id: 1, name: 'Alice Johnson', department: 'Engineering' },
        { id: 2, name: 'Bob Smith', department: 'Marketing' },
        { id: 3, name: 'Carol Davis', department: 'HR' }
      ]
    };
  }

  sendMessageToMFE() {
    this.messageBus.emit('HOST_MESSAGE', {
      message: 'Hello from Host!',
      timestamp: new Date().toISOString()
    });
  }

  updateTheme(theme: string) {
    this.messageBus.setState('theme', theme);
  }

  clearMessages() {
    this.messages = [];
  }
}