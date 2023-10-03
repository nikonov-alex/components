import morphdom from "morphdom";

const is_global_event = ( name: string ): boolean =>
    [ "hashchange", "popstate" ].includes( name );

type RenderFunc<State> = { ( s: State ): HTMLElement };

type Events<State> = { [k: string]: { (s: State, e: Event): State } };

type Options<State> = {
    events?: Events<State>,
    updateOptions?: { ( s: State, o: object ): State },
    triggerEvent?: { ( os: State, ns: State ): Event | null }
    sendHTTPMessage?: { ( os: State, ns: State ): Request | null }
    receiveHTTPMessage?: { ( s: State, m: Response ): State }
};

class Component<State> {

    private _state: State;
    private _root: HTMLElement = document.createElement( "div" );
    private _events;
    private _updateOptions;
    private _triggerEvent;
    private _sendHTTPMessage;
    private _receiveHTTPMessage;
    private _opts;


    constructor(
        initialState: State,
        private _render: RenderFunc<State>,
        opts: Options<State>
    ) {
        this._state = initialState, // todo: need deep clone here
        this._events = opts.events ?? { },
        this._updateOptions = opts.updateOptions,
        this._triggerEvent = opts.triggerEvent,
        this._sendHTTPMessage = opts.sendHTTPMessage,
        this._receiveHTTPMessage = opts.receiveHTTPMessage,
        this._opts = opts;
    }

    private _redraw( newState: State ) {
        const rendered = this._draw( newState );

        if ( this._root.nodeName !== rendered.nodeName ) {
            this._root.replaceWith( rendered );
            this._root = rendered;
        }
        else {
            this._root.querySelectorAll( ".component" ).forEach(
                node => {
                    // @ts-ignore
                    node.component._unmount();
                    // @ts-ignore
                    delete node.component;
                }
            );

            morphdom( this._root, rendered.cloneNode( true ) );

            const components = rendered.querySelectorAll( ".component" );
            this._root.querySelectorAll( ".component" ).forEach(
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
        if ( this._triggerEvent ) {
            const event = this._triggerEvent( oldState, this._state );
            if ( event ) {
                this._root.dispatchEvent( event );
            }
        }
    }

    private _httpResponseHandler = ( response: Response ) => {
        this._maybeStateChanged(
            // @ts-ignore
            this._receiveHTTPMessage( this._state, response ) );
    }

    private _maybeMakeRequest( oldState: State ) {
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

    private _eventHandler = ( event: Event ) => {
        if ( !this._events.hasOwnProperty( event.type ) ) {
            return;
        }

        if ( [ "submit", "click" ].includes( event.type ) ) {
            event.preventDefault();
        }
        event.stopImmediatePropagation();

        this._maybeStateChanged(
            this._events[event.type]( this._state, event ) );
    }

    private _mount() {
        for ( let event in this._events ) {
            if ( this._events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : this._root;
                target.addEventListener( event, this._eventHandler, true );
            }
        }
    }

    private _unmount(){
        for ( let event in this._events ) {
            if ( this._events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : this._root;
                target.removeEventListener( event, this._eventHandler, true );
            }
        }
    }

    private _draw( state: State ): HTMLElement {
        const rendered = this._render( state );
        rendered.classList.add( "component" );
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