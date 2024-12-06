module Pages.Schedule exposing (Model, Msg, page)

import Effect exposing (Effect)
import Html
import Html.Attributes exposing (type_)
import Html.Events exposing (onInput)
import Page exposing (Page)
import Route exposing (Route)
import Shared
import View exposing (View)


page : Shared.Model -> Route () -> Page Model Msg
page shared route =
    Page.new
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }



-- INIT


type alias Model =
    { events : List Event }


events : List Event
events =
    [ { name = "Opening Keynote", time = "09:00 AM", location = "Main Hall" }
    , { name = "Elm Workshop", time = "10:00 AM", location = "Room A" }
    , { name = "Networking Lunch", time = "12:00 PM", location = "Cafeteria" }
    , { name = "Haskell Talk", time = "01:00 PM", location = "Room B" }
    , { name = "Closing Remarks", time = "04:00 PM", location = "Main Hall" }
    ]


init : () -> ( Model, Effect Msg )
init () =
    ( { events = events }
    , Effect.none
    )



-- UPDATE


type Msg
    = NoOp
    | FilterInput String


update : Msg -> Model -> ( Model, Effect Msg )
update msg model =
    case msg of
        NoOp ->
            ( model
            , Effect.none
            )

        FilterInput s ->
            ( model
            , Effect.none
            )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none



-- VIEW


view : Model -> View Msg
view model =
    { title = "Pages.Schedule"
    , body =
        [ Html.text "/schedule"
        , Html.p [] [ Html.text "Schedule" ]
        , Html.input [ type_ "text", onInput FilterInput ] []
        , viewEvents model.events
        ]
    }


viewEvents : List Event -> Html.Html Msg
viewEvents eventsToView =
    Html.ul []
        (List.map
            (\event ->
                Html.li [] [ Html.text event.name ]
            )
            eventsToView
        )


type alias Event =
    { name : String
    , time : String
    , location : String
    }
