import morphdom from "morphdom";


const is_global_event = name =>
    [ "hashchange", "popstate" ].includes( name );

const component = (
    initialState,
    render,
    {
        events = { },
        updateOptions = ( state, options ) => state,
        triggerEvent = false,
    }
) => {
    let state = initialState;
    let root;

    const updateRoot = newRoot => {
        root = newRoot;
    }

    const redraw = newState => {
        const rendered = draw( newState );

        if ( root.nodeName !== rendered.nodeName ) {
            root.replaceWith( rendered );
            updateRoot( rendered );
        }
        else {
            root.querySelectorAll( ".component" ).forEach(
                component => {
                    component.unmount( component.eventHandler );
                    component.updateRoot = undefined;
                    component.eventHandler = undefined;
                    component.mount = undefined;
                    component.unmount = undefined;
                }
            );

            morphdom( root, rendered.cloneNode( true ) );

            const components = rendered.querySelectorAll( ".component" );
            root.querySelectorAll( ".component" ).forEach(
                ( component, index ) => {
                    component.updateRoot = components[index].updateRoot;
                    component.eventHandler = components[index].eventHandler;
                    component.mount = components[index].mount;
                    component.unmount = components[index].unmount;

                    component.updateRoot( component );
                    component.mount( component.eventHandler );
                } );
        }
    }

    const maybeDispatchEvent = oldState => {
        if ( triggerEvent ) {
            const event = triggerEvent( oldState, state );
            if ( event ) {
                root.dispatchEvent( event );
            }
        }
    }

    const maybeStateChanged = newState => {
        if ( newState !== state ) {
            redraw( newState );
            const oldState = state;
            state = newState;
            maybeDispatchEvent( oldState );
        }
    }

    const eventHandler = function ( event ) {
        if ( !events.hasOwnProperty( event.type ) ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        maybeStateChanged(
            events[event.type]( state, event ) );
    };

    const mount = eventHandler => {
        for ( let event in events ) {
            if ( events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : root;
                target.addEventListener( event, eventHandler, true );
            }
        }
    }

    const unmount = eventHandler => {
        for ( let event in events ) {
            if ( events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : root;
                target.removeEventListener( event, eventHandler, true );
            }
        }
    }

    const draw = state => {
        const rendered = render( state );
        rendered.classList.add( "component" );
        rendered.eventHandler = eventHandler;
        rendered.updateRoot = updateRoot;
        rendered.mount = mount;
        rendered.unmount = unmount;
        return rendered;
    }

    return ( options = null ) => {
        const newState = updateOptions( state, options );
        if ( state !== newState ) {
            state = newState;
        }
        updateRoot( draw( state ) );
        mount( eventHandler );
        return root;
    }
}

export default component;