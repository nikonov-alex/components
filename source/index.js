import morphdom from "morphdom";

const is_global_event = name =>
    [ "hashchange", "popstate" ].includes( name );

class Component {

    constructor( initialState, render, opts ) {
        this._state = initialState, // todo: need deep clone here
        this._root = null,
        this._render = render,
        this._events = opts.events ?? { },
        this._updateOptions = opts.updateOptions,
        this._triggerEvent = opts.triggerEvent,
        this._sendHTTPMessage = opts.sendHTTPMessage,
        this._receiveHTTPMessage = opts.receiveHTTPMessage,
        this._opts = opts;
    }

    _redraw( newState ) {
        const rendered = this._draw( newState );

        if ( this._root.nodeName !== rendered.nodeName ) {
            this._root.replaceWith( rendered );
            this._root = rendered;
        }
        else {
            this._root.querySelectorAll( ".component" ).forEach(
                node => {
                    node.component._unmount();
                    delete node.component;
                }
            );

            morphdom( this._root, rendered.cloneNode( true ) );

            const components = rendered.querySelectorAll( ".component" );
            this._root.querySelectorAll( ".component" ).forEach(
                ( node, index ) => {
                    node.component = components[index].component;
                    node.component._root = node;
                    node.component._mount();
                } );
        }
    }

    _maybeDispatchEvent ( oldState ) {
        if ( this._triggerEvent ) {
            const event = this._triggerEvent( oldState, this._state );
            if ( event ) {
                this._root.dispatchEvent( event );
            }
        }
    }

    _httpResponseHandler = response => {
        this._maybeStateChanged(
            this._receiveHTTPMessage( this._state, response ) );
    }

    _maybeMakeRequest( oldState ) {
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

    _maybeStateChanged( newState ) {
        if ( newState !== this._state ) {
            this._redraw( newState );
            const oldState = this._state;
            this._state = newState;
            this._maybeMakeRequest( oldState );
            this._maybeDispatchEvent( oldState );
        }
    }

    _eventHandler = event => {
        if ( !this._events.hasOwnProperty( event.type ) ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        this._maybeStateChanged(
            this._events[event.type]( this._state, event ) );
    }

    _mount() {
        for ( let event in this._events ) {
            if ( this._events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : this._root;
                target.addEventListener( event, this._eventHandler, true );
            }
        }
    }

    _unmount(){
        for ( let event in this._events ) {
            if ( this._events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : this._root;
                target.removeEventListener( event, this._eventHandler, true );
            }
        }
    }

    _draw( state ) {
        const rendered = this._render( state );
        rendered.classList.add( "component" );
        rendered.component = this;
        return rendered;
    }

}

const make_component = ( initialState, render, opts ) =>
    new Component( initialState, render, opts )

const draw_component = component => {
    component._root = component._draw( component._state );
    component._mount();
    return component._root;
}

const update_component = ( component, options ) =>
    !component._updateOptions
        ? component
        : make_component(
            component._updateOptions( component._state, options ),
            component._render,
            component._opts
        );



export { make_component, draw_component, update_component };