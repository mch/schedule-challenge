module Pages.Home_ exposing (page)

import Html
import View exposing (View)


page : View msg
page =
    { title = "Homepage"
    , body =
        [ Html.text "Retro"
        , Html.h1 [] [ Html.text "What Went Well?" ]
        , Html.ul []
            [ Html.li [] [ Html.text "We got it working again" ]
            , Html.li [] [ Html.text "Tuple is working really nicely" ]
            , Html.li [] [ Html.text "We pivoted and solved a problem as a group" ]
            , Html.li [] [ Html.text "We learned some basic elm syntax" ]
            , Html.li [] [ Html.text "Splitting the code and view allows us to get fast feedback" ]
            , Html.li [] [ Html.text "Deploy before test driving lets us get moving faster" ]
            , Html.li [] [ Html.text "GitPod Flex failed us :(" ]
            ]
        , Html.h1 [] [ Html.text "What Went Less Well?" ]
        , Html.ul []
            [ Html.li [] [ Html.text "ssh issues" ]
            , Html.li [] [ Html.text "mobtime was set up with roles reversed, which was confusing" ]
            , Html.li [] [ Html.text "mobtime in same window as coding" ]
            , Html.li [] [ Html.text "Tony could not join this time, suggest using wine next time" ]
            , Html.li [] [ Html.text "Windows host meant keyboard issues" ]
            ]
        ]
    }
