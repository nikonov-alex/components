import morphdom from "morphdom";


const is_global_event = name =>
    [ "hashchange", "popstate" ].includes( name );

const component = (
    initialState,
    render,
    {
        events = { },
        updateOptions = ( state, options ) => state,
        triggerEvent = false
    }
) => {
    let state = initialState;

    const redraw = ( mounted, newState ) => {
        const rendered = draw( newState );

        if ( mounted.nodeName !== rendered.nodeName ) {
            mounted.replaceWith( rendered );
            return rendered;
        }
        else {
            mounted.querySelectorAll( ".component" ).forEach(
                mounted => {
                    mounted.unmount( mounted, mounted.handler );
                    mounted.handler = undefined;
                    mounted.mount = undefined;
                    mounted.unmount = undefined;
                }
            );

            morphdom( mounted, rendered.cloneNode( true ) );

            const components = rendered.querySelectorAll( ".component" );
            mounted.querySelectorAll( ".component" ).forEach(
                ( mounted, index ) => {
                    mounted.handler = components[index].mount( mounted );
                    mounted.mount = components[index].mount;
                    mounted.unmount = components[index].unmount;
                } );
            return mounted;
        }
    }

    const maybeDispatchEvent = ( node, oldState ) => {
        if ( triggerEvent ) {
            const event = triggerEvent( oldState, state );
            if ( event ) {
                node.dispatchEvent( event );
            }
        }
    }

    const handler = function ( event ) {
        if ( !events.hasOwnProperty( event.type ) ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        let newState = events[event.type]( state, event );
        if ( newState !== state ) {
            const node = redraw( this, newState );
            const oldState = state;
            state = newState;
            maybeDispatchEvent( node, oldState );
        }
    };

    const mount = ( node ) => {
        const h = handler.bind( node );
        for ( let event in events ) {
            if ( events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : node;
                target.addEventListener( event, h, true );
            }
        }
        return h;
    }

    const unmount = ( node, handler ) => {
        for ( let event in events ) {
            if ( events.hasOwnProperty( event ) ) {
                const target = is_global_event( event )
                    ? window
                    : node;
                target.removeEventListener( event, handler, true );
            }
        }
    }

    const draw = state => {
        const rendered = render( state );
        rendered.classList.add( "component" );
        rendered.handler = mount( rendered );
        rendered.mount = mount;
        rendered.unmount = unmount;
        return rendered;
    }

    return ( options = null ) => {
        const newState = updateOptions( state, options );
        if ( state !== newState ) {
            state = newState;
        }
        return draw( state );
    }
};

export default component;