import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { MessageBusService } from '../shared/services/message-bus.service';
import { MfeLoaderService } from '../shared/services/mfe-loader.service';
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
  @ViewChild('mfeContainer', { static: true }) mfeContainer!: ElementRef;
  isLoader: boolean = true;
  isSendMessageToMFE: boolean = true;
  isDisableMFELoad: boolean = false;

  constructor(private messageBus: MessageBusService, private cdr: ChangeDetectorRef, private mfeLoader: MfeLoaderService, private renderer: Renderer2,
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

  addLoader() {
    const div = this.renderer.createElement('div');
    this.renderer.addClass(div, 'mfe-loading');
    this.renderer.appendChild(this.mfeContainer.nativeElement, div);
  }

  async loadMfe(): Promise<void> {
      try {
        this.isLoader = true;
        this.isSendMessageToMFE = true; // prevent sending until loaded

        // 1️⃣ Load JS + CSS assets for MFE
        await this.mfeLoader.loadAssets(
          'user-management-mfe',
          './assets/user-management-mfe/user-management-mfe.js',
          './assets/user-management-mfe/styles.css'
        );

        // 2️⃣ Show loader while assets are bootstrapping
        this.addLoader();

        // 3️⃣ Create the custom element once assets are available
        const mfeElement = document.createElement('user-management-mfe');

        // Clear container & inject new MFE element
        const container = this.mfeContainer.nativeElement;
        container.innerHTML = '';
        container.appendChild(mfeElement);

        // 4️⃣ Mark as loaded (Angular can use this to hide loader)
        this.isLoader = false;
        this.isSendMessageToMFE = false;
        this.isDisableMFELoad = true;

      } catch (error) {
        console.error('❌ Failed to load MFE:', error);
        this.isLoader = false;
      }
    }
}