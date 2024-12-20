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
        , retro20241213
        , retro20241220
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
    retroDay "2024-12-06" whatWentWellItems whatWentLessWellItems


retro20241213 : Html msg
retro20241213 =
    let
        whatWentWellItems : List (Html msg)
        whatWentWellItems =
            [ retroItem "Created a filter function!!"
            , retroItem "Added our first tests"
            , retroItem "Learned how to run tests in elm"
            ]

        whatWentLessWellItems : List (Html msg)
        whatWentLessWellItems =
            [ retroItem "Missed CoPilot"
            , retroItem "Understanding the modules and function syntax is tricky"
            ]
    in
    retroDay "2024-12-13" whatWentWellItems whatWentLessWellItems


retro20241220 : Html msg
retro20241220 =
    let
        whatWentWellItems : List (Html msg)
        whatWentWellItems =
            [ retroItem "Used coaching  questions to help find things that weren't clear, and gave an opening to explain"
            , retroItem "Using diff tool to see what changed to help write commit message"
            , retroItem "Able to change the type definition from string to Record"
            , retroItem "We got to see the filter work on the web page!"
            , retroItem "Backed up after the type error to fix the tests before changing production code"
            , retroItem "Learned that you can make lots of commits and push them later"
            ]

        whatWentLessWellItems : List (Html msg)
        whatWentLessWellItems =
            [ retroItem "The filter has a bug"
            , retroItem "Windows keyboard issues"
            , retroItem "It felt uncomfortable to use git revert, cmd-z was easier"
            , retroItem "We did two things at once: move a function and use it, but didn't fully complete the move before trying to use it"
            ]
    in
    retroDay "2024-12-20" whatWentWellItems whatWentLessWellItems
