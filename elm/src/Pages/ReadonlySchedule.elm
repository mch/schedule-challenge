module Pages.ReadonlySchedule exposing (Model, Msg, page)

import Html exposing (Html)
import Page exposing (Page)
import View exposing (View)


page : Page Model Msg
page =
    Page.sandbox
        { init = init
        , update = update
        , view = view
        }



-- INIT


type alias Model =
    {}


init : Model
init =
    {}



-- UPDATE


type Msg
    = NoOp


update : Msg -> Model -> Model
update msg model =
    case msg of
        NoOp ->
            model



-- VIEW


view : Model -> View Msg
view model =
    { title = "Pages.ReadonlySchedule"
    , body =
        [ Html.text "My /readonly-schedule"
        , Html.p [] []
        ]
    }
