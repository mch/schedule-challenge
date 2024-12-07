module Pages.Retro exposing (Model, Msg, page)

import Effect exposing (Effect)
import Html exposing (Html, div, h1, h2, h3, li, text, ul)
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
    {}


init : () -> ( Model, Effect Msg )
init () =
    ( {}
    , Effect.none
    )



-- UPDATE


type Msg
    = NoOp


update : Msg -> Model -> ( Model, Effect Msg )
update msg model =
    case msg of
        NoOp ->
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
    { title = "Pages.Retro"
    , body =
        [ h1 [] [ text "Retro" ]
        , retro20241129
        , retro20241206
        ]
    }


retroDay : String -> List (Html msg) -> List (Html msg) -> Html msg
retroDay date wentWellItems wentLessWellItems =
    div []
        [ h2 [] [ text date ]
        , h3 [] [ text "What Went Well?" ]
        , ul [] wentWellItems
        , h3 [] [ text "What Went Less Well?" ]
        , ul [] wentLessWellItems
        ]


retroItem : String -> Html msg
retroItem text =
    li [] [ Html.text text ]


retro20241129 : Html msg
retro20241129 =
    let
        whatWentWellItems : List (Html msg)
        whatWentWellItems =
            [ retroItem "We got it working again"
            , retroItem "Tuple is working really nicely"
            , retroItem "We pivoted and solved a problem as a group"
            , retroItem "We learned some basic elm syntax"
            , retroItem "Splitting the code and view allows us to get fast feedback"
            , retroItem "Deploy before test driving lets us get moving faster"
            , retroItem "We advanced with the event model"
            , retroItem "We worry about to quickly get the syntax working"
            , retroItem "We got to declare a type"
            , retroItem "We learned about Html.Events and Attributes"
            ]

        whatWentLessWellItems : List (Html msg)
        whatWentLessWellItems =
            [ retroItem "ssh issues"
            , retroItem "mobtime was set up with roles reversed, which was confusing"
            , retroItem "mobtime in same window as coding"
            , retroItem "Tony could not join this time, suggest using wine next time"
            , retroItem "Windows host meant keyboard issues"
            , retroItem "GitPod Flex failed us :("
            ]
    in
    retroDay "2024-11-29" whatWentWellItems whatWentLessWellItems


retro20241206 : Html msg
retro20241206 =
    let
        whatWentWellItems : List (Html msg)
        whatWentWellItems =
            [ retroItem "We advanced with the event model"
            , retroItem "We worry about to quickly get the syntax working"
            , retroItem "We got to declare a type"
            , retroItem "We learned about Html.Events and Attributes"
            ]

        whatWentLessWellItems : List (Html msg)
        whatWentLessWellItems =
            [ retroItem "repeated keys for the host"
            ]
    in
    retroDay "2024-11-29" whatWentWellItems whatWentLessWellItems