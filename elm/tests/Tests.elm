module Tests exposing (..)

import Expect
import Pages.Schedule exposing (Event, filterEvents)
import Test exposing (Test, describe, test)


dummyEvents : List Event
dummyEvents =
    [ { name = "Eat breakfast", time = "8:00", location = "Home" }
    , { name = "Workout", time = "8:00", location = "Home" }
    , { name = "Eat lunch", time = "8:00", location = "Home" }
    ]


suite : Test
suite =
    describe "Schedule Logic"
        [ test "we can filter the schedule to match input" <|
            \_ ->
                Expect.equal
                    (filterEvents dummyEvents "Eat")
                    [ { name = "Eat breakfast", time = "8:00", location = "Home" }
                    , { name = "Eat lunch", time = "8:00", location = "Home" }
                    ]
        , test "if nothing matches, nothing is returned" <|
            \_ ->
                Expect.equal
                    (filterEvents dummyEvents "drink coffe")
                    []
        , test "if the query matches multiple items in the list return all the items that contains the query" <|
            \_ ->
                Expect.equal
                    (filterEvents dummyEvents "Eat")
                    [ { name = "Eat breakfast", time = "8:00", location = "Home" }
                    , { name = "Eat lunch", time = "8:00", location = "Home" }
                    ]
        ]
