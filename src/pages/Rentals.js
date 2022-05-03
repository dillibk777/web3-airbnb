import React from "react";
import "./Rentals.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import logo from "../images/airbnbRed.png";
import { Button, ConnectButton, Icon, useNotification } from "web3uikit";
import RentalsMap from "../components/RentalsMap";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3ExecuteFunction } from "react-moralis";
import User from "../components/User";

const Rentals = () => {
  const { state: searchFilters } = useLocation();
  const [highlight, setHighlight] = useState();
  const { Moralis, account } = useMoralis();
  const [rentalsList, setRentalsList] = useState([]);
  const [coords, setCoords] = useState([]);
  const dispatch = useNotification();
  const contractProcessor = useWeb3ExecuteFunction();

  const handleSuccess = () => {
    dispatch({
      type: "success",
      message: `Nice! You are going to ${searchFilters.destination}`,
      title: "Booking Successful",
      position: "topR",
    });
  };

  const handleError = (err) => {
    dispatch({
      type: "error",
      message: `${err}`,
      title: "Booking Failed",
      position: "topR",
    });
  };

  let cords = [];
  rentalsList.forEach((e, index) => {
    cords.push({ lat: +e.attributes.lat, lng: +e.attributes.long });
  });

  useEffect(() => {
    async function fetchRentalsList() {
      const Rentals = Moralis.Object.extend("rentals");
      const query = new Moralis.Query(Rentals);
      query.equalTo("city", searchFilters.destination);
      query.greaterThanOrEqualTo("maxGuests_decimal", searchFilters.guests);
      const results = await query.find();
      setRentalsList(results);
      let cords = [];
      rentalsList.forEach((e, index) => {
        cords.push({ lat: +e.attributes.lat, lng: +e.attributes.long });
      });
      setCoords(cords);
    }
    fetchRentalsList();
  }, [searchFilters]);

  const bookRental = async function (start, end, id, dayPrice) {
    for (
      var arr = [], dt = new Date(start);
      dt <= end;
      dt.setDate(dt.getDate() + 1)
    ) {
      arr.push(new Date(dt).toISOString().slice(0, 10)); // yyyy-mm-dd
    }

    let options = {
      contractAddress: "0x1531f16C5b8CC03aABB86b14633387A26b90D15D",
      functionName: "addDatesBooked",
      abi: [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "id",
              type: "uint256",
            },
            {
              internalType: "string[]",
              name: "newBookings",
              type: "string[]",
            },
          ],
          name: "addDatesBooked",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
      ],
      params: {
        id: id,
        newBookings: arr,
      },
      msgValue: Moralis.Units.ETH(dayPrice * arr.length),
    };
    console.log(arr);

    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        handleSuccess();
      },
      onError: (error) => {
        handleError(error.data.message);
      },
    });
  };
  const handleNoAccount = () => {
    dispatch({
      type: "error",
      message: `You need to connect your wallet to book a rental`,
      title: "Not Connected",
      position: "topL",
    });
  };

  return (
    <>
      <div className="topBanner">
        <div>
          <Link to={"/"}>
            <img className="logo" src={logo} alt="logo"></img>
          </Link>
        </div>
        <div className="searchReminder">
          <div className="filter">{searchFilters?.destination.label}</div>
          <div className="vl"></div>
          <div className="filter">
            {`
            ${searchFilters.checkIn.toLocaleString("default", {
              month: "short",
            })}
            ${searchFilters.checkIn.toLocaleString("default", {
              day: "2-digit",
            })}
             - 
             ${searchFilters.checkOut.toLocaleString("default", {
               month: "short",
             })}
            ${searchFilters.checkOut.toLocaleString("default", {
              day: "2-digit",
            })}
            `}
          </div>
          <div className="vl"></div>
          <div className="filter">{searchFilters.guests} Guest </div>
          <div className="searchFiltersIcon">
            <Icon fill="#ffffff" size={20} svg="search" />
          </div>
        </div>
        <div className="lrContainers">
          {account && <User account={account} />}
          <ConnectButton> </ConnectButton>
        </div>
      </div>
      <hr className="line"></hr>
      <div className="rentalsContent">
        <div className="rentalsContentL">
          Stays available for your destination
          {rentalsList &&
            rentalsList.map((rental, i) => {
              return (
                <>
                  <hr className="line2"></hr>
                  <div className={highlight == i ? "rentalDivH" : "rentalDiv"}>
                    <img
                      className="rentalImg"
                      src={rental.attributes.imgUrl}
                    ></img>
                    <div className="rentalInfo">
                      <div className="rentalTitle">
                        {rental.attributes.name}
                      </div>
                      <div className="rentalDesc">
                        {rental.attributes.unoDescription}
                      </div>
                      <div className="rentalDesc">
                        {rental.attributes.dosDescription}
                      </div>
                      <div className="bottomButton">
                        <Button
                          text="Stay Here"
                          onClick={() => {
                            if (account) {
                              bookRental(
                                searchFilters.checkIn,
                                searchFilters.checkOut,
                                rental.attributes.uid_decimal.value
                                  .$numberDecimal,
                                Number(
                                  rental.attributes.pricePerDay_decimal.value
                                    .$numberDecimal
                                )
                              );
                            } else {
                              handleNoAccount();
                            }
                          }}
                        ></Button>
                        <div className="price">
                          <Icon fill="#808080" size={10} svg="matic" />{" "}
                          {rental.attributes.pricePerDay} / Day
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })}
        </div>
        <div className="rentalsContentR">
          <RentalsMap
            locations={coords}
            setHighlight={setHighlight}
          ></RentalsMap>
        </div>
      </div>
    </>
  );
};

export default Rentals;
