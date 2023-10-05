import morphdom from "morphdom";

type RenderFunc<State> = { ( s: State ): HTMLElement };

type Events<State> = { [k: string]: { (s: State, e: Event): State } };

type Options<State> = {
    localEvents?: Events<State>,
    globalEvents?: Events<State>,
    updateOptions?: { ( s: State, o: object ): State },
    triggerLocalEvent?: { ( os: State, ns: State ): Event | null }
    triggerGlobalEvent?: { ( os: State, ns: State ): Event | null }
    sendHTTPMessage?: { ( os: State | null, ns: State ): Request | null }
    receiveHTTPMessage?: { ( s: State, m: Response, text: string ): State },
    captureEvents?: boolean
};

class Component<State> {

    private _state: State;
    private _root: HTMLElement = document.createElement( "div" );
    private _localEvents;
    private _globalEvents;
    private _updateOptions;
    private _triggerLocalEvent;
    private _triggerGlobalEvent;
    private _sendHTTPMessage;
    private _receiveHTTPMessage;
    private _captureEvents;
    private _opts;


    constructor(
        initialState: State,
        private _render: RenderFunc<State>,
        opts: Options<State>
    ) {
        this._state = initialState; // todo: need deep clone here
        this._localEvents = opts.localEvents ?? { };
        this._globalEvents = opts.globalEvents ?? { };
        this._updateOptions = opts.updateOptions;
        this._triggerLocalEvent = opts.triggerLocalEvent;
        this._triggerGlobalEvent = opts.triggerGlobalEvent;
        this._sendHTTPMessage = opts.sendHTTPMessage;
        this._receiveHTTPMessage = opts.receiveHTTPMessage;
        this._captureEvents = opts.captureEvents ?? false;
        this._opts = opts;
        this._maybeMakeRequest( null );
    }

    private _redraw( newState: State ) {
        const rendered = this._draw( newState );

        if ( this._root.nodeName !== rendered.nodeName ) {
            this._root.replaceWith( rendered );
            this._root = rendered;
        }
        else {
            this._root.querySelectorAll( ".na-component" ).forEach(
                node => {
                    // @ts-ignore
                    node.component._unmount();
                    // @ts-ignore
                    delete node.component;
                }
            );

            morphdom( this._root, rendered.cloneNode( true ) );

            const components = rendered.querySelectorAll( ".na-component" );
            this._root.querySelectorAll( ".na-component" ).forEach(
                ( node, index ) => {
                    // @ts-ignore
                    node.component = components[index].component;
                    // @ts-ignore
                    node.component._root = node;
                    // @ts-ignore
                    node.component._mount();
                } );
        }
    }

    private _maybeDispatchEvent ( oldState: State ) {
        if ( this._triggerLocalEvent ) {
            const event = this._triggerLocalEvent( oldState, this._state );
            if ( event ) {
                this._root.dispatchEvent( event );
            }
        }
        if ( this._triggerGlobalEvent ) {
            const event = this._triggerGlobalEvent( oldState, this._state );
            if ( event ) {
                window.dispatchEvent( event );
            }
        }
    }

    private _httpResponseHandler = ( response: Response ) => {
        response.text().then( body =>
            this._maybeStateChanged(
                // @ts-ignore
                this._receiveHTTPMessage( this._state, response, body ) )
        );
    }

    private _maybeMakeRequest( oldState: State | null ) {
        if ( this._sendHTTPMessage ) {
            const request = this._sendHTTPMessage( oldState, this._state );
            if ( request ) {
                const promise = fetch( request );
                if ( this._receiveHTTPMessage ) {
                    promise.then( this._httpResponseHandler );
                }
            }
        }
    }

    private _maybeStateChanged( newState: State ) {
        if ( newState !== this._state ) {
            this._redraw( newState );
            const oldState = this._state;
            this._state = newState;
            this._maybeMakeRequest( oldState );
            this._maybeDispatchEvent( oldState );
        }
    }

    private _localEventHandler = ( event: Event ) => {
        if ( !this._localEvents.hasOwnProperty( event.type ) ) {
            return;
        }

        if ( [ "submit", "click" ].includes( event.type ) ) {
            event.preventDefault();
        }
        event.stopImmediatePropagation();

        this._maybeStateChanged(
            this._localEvents[event.type]( this._state, event ) );
    }

    private _globalEventHandler = ( event: Event ) => {
        if ( !this._globalEvents.hasOwnProperty( event.type ) ) {
            return;
        }

        this._maybeStateChanged(
            this._globalEvents[event.type]( this._state, event ) );
    }

    private _mount() {
        for ( let event in this._localEvents ) {
            if ( this._localEvents.hasOwnProperty( event ) ) {
                this._root.addEventListener( event, this._localEventHandler, this._captureEvents );
            }
        }
        for ( let event in this._globalEvents ) {
            if ( this._globalEvents.hasOwnProperty( event ) ) {
                window.addEventListener( event, this._globalEventHandler, this._captureEvents );
            }
        }
    }

    private _unmount(){
        for ( let event in this._localEvents ) {
            if ( this._localEvents.hasOwnProperty( event ) ) {
                this._root.removeEventListener( event, this._localEventHandler, this._captureEvents );
            }
        }
        for ( let event in this._globalEvents ) {
            if ( this._globalEvents.hasOwnProperty( event ) ) {
                this._root.removeEventListener( event, this._globalEventHandler, this._captureEvents );
            }
        }
    }

    private _draw( state: State ): HTMLElement {
        const rendered = this._render( state );
        rendered.classList.add( "na-component" );
        // @ts-ignore
        rendered.component = this;
        return rendered;
    }

}

const make_component = <State>( initialState: State, render: RenderFunc<State>, opts: Options<State> ): Component<State> =>
    new Component( initialState, render, opts )

const draw_component = <State>( component: Component<State> ): HTMLElement => {
    // @ts-ignore
    component._root = component._draw( component._state );
    // @ts-ignore
    component._mount();
    // @ts-ignore
    return component._root;
}

const update_component = <State>( component: Component<State>, options: object ): Component<State> =>
    // @ts-ignore
    !component._updateOptions
        ? component
        : make_component(
            // @ts-ignore
            component._updateOptions( component._state, options ),
            // @ts-ignore
            component._render,
            // @ts-ignore
            component._opts
        );



export { make_component, draw_component, update_component, Component };