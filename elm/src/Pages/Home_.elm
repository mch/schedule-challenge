module Pages.Home_ exposing (page)

import Html exposing (Html, a, h1, h2, li, p, text, ul)
import Html.Attributes exposing (href)
import View exposing (View)


page : View msg
page =
    { title = "Homepage"
    , body =
        [ h1 [] [ text "Retro" ]
        , p [] [ a [ href "/retro" ] [ text "Retro" ] ]
        ]
    }
