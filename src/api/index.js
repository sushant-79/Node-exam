
import { version } from "../../package.json";
import { Router } from "express";
const asyncHandler = require('express-async-handler')
​
​
​
export default ({ config, db }) => {
  let api = Router();
​
​
​
  const Handler = (ref_id, position, temp, user_id, res) => {
​
    const countQuery = 'SELECT COUNT(*) FROM pyramid'
    db.query(
      countQuery,
      (err, response) => {
        if (err) {
          console.log(err.stack);
        } else {
​
​
          let user = parseInt(response.rows[0].count) + 1
          const query3 = `INSERT INTO pyramid(user_id, ref_id,position) VALUES(${user},${ref_id},'${position}')`
          db.query(
            query3,
            (err, response) => {
              if (err) {
                console.log(err.stack);
              } else {
​
                let tempLocation;
                if (temp === "has_left") {
                  tempLocation = 'next_left'
                } else {
                  tempLocation = 'next_right'
                }
​
​
                const query4 = `UPDATE pyramid SET ${temp}=true,${tempLocation}=${user} where user_id=${user_id}`
                db.query(
                  query4,
                  (err, response) => {
                    if (err) {
                      console.log(err.stack);
                    } else {
                      console.log('benc')
                      res.json({ status: "successful" });
                    }
                  }
                )
​
              }
            }
          )
​
        }
      }
    )
​
​
  }
​
​
  const queryHandler = (ref_id, position, temp, user_id, res) => {
​
    let tempLocation;
    if (temp === "has_left") {
      tempLocation = 'next_left'
    } else {
      tempLocation = 'next_right'
    }
    console.log(ref_id, position, temp, user_id, "fuck mei ")
​
    const query2 = `SELECT user_id,${temp},${tempLocation} FROM pyramid where user_id=${user_id}`
    db.query(
      query2,
      (err, response) => {
        if (err) {
          console.log(err.stack);
        } else {
​
​
          // recusive try
​
          if (response.rows[0][temp]) {
​
            const query5 = `SELECT user_id,has_left,has_right,${tempLocation} FROM pyramid where user_id=${response.rows[0][tempLocation]}`
            db.query(
              query5,
              (err, response1) => {
                if (err) {
                  console.log(err.stack);
                } else {
​
                  if (response1.rows[0][tempLocation] === null) {
                    return Handler(ref_id, position, temp, response.rows[0][tempLocation], res)
                  }
​
                  queryHandler(ref_id, position, temp, response1.rows[0][tempLocation], res)
                }
              })
          } else {
            Handler(ref_id, position, temp, user_id, res)
          }
​
        }
      }
    )
​
  }
​
​
​
  api.post("/pyramid", async (req, res) => {
​
    const { ref_id, position } = req.body
    const query1 = `SELECT user_id,has_left,has_right,next_left,next_right FROM pyramid where user_id=${ref_id}`
    db.query(
      query1,
      (err, response) => {
        if (err) {
          console.log(err.stack);
        } else {
          console.log(response.rows);
​
          let temp;
          if (position === "left") {
            temp = 'has_left'
          } else {
            temp = 'has_right'
          }
          let user_id = response.rows[0].user_id
          queryHandler(ref_id, position, temp, user_id, res)
​
        }
      }
    )
  })
​
  //get children
​
  var arr1 = [];
  const preOrder = async (next) => {
    const queryClub = `SELECT * FROM pyramid where user_id=${next}`
    let xy = await db.query(queryClub);
    if (!xy.rows) {
      console.log(err.stack);
    } else {
      // console.log(response.rows);
      arr1.push(xy.rows[0])
      console.log(arr1);
      let { next_left, next_right } = xy.rows[0];
      if (next !== null) {
        // console.log(next);
        if (next_left != null) {
          await preOrder(next_left);
        }
        if (next_right != null) {
          await preOrder(next_right);
        }
      }
    }
​
  }
​
  api.post("/pyramidchild", asyncHandler(async (req, res) => {
    const { user_id } = req.body
    const query1 = `SELECT user_id,next_left,next_right,position FROM pyramid where user_id=${user_id}`
    let newRes = await db.query(
      query1
    )
​
​
    if (!newRes.rows) {
      console.log(err.stack);
    } else {
​
      let finalResult = await preOrder(newRes.rows[0].user_id)
​
    }
​
    res.json({ child: arr1 })
​
  }))
​
​
  //earning
​
  var left1 = 0, right1 = 0;
  const preOrder1 = asyncHandler(async (next, tree) => {
    const queryClub = `SELECT * FROM pyramid where user_id=${next}`
    let newRes = await db.query(queryClub)
​
    if (!newRes.rows) {
      console.log(err.stack);
    }
    else {
​
​
      let { next_left, next_right } = newRes.rows[0];
      if (next !== null) {
        if (tree == "left") {
          left1++;
​
​
        }
        if (tree == "right") {
          right1++;
​
        }
​
        if (next_left != null) {
​
          let yy = await preOrder1(next_left, tree);
        }
        if (next_right != null) {
​
          let zz = await preOrder1(next_right, tree);
        }
      }
​
    }
  }
  )
​
​
​
  api.post("/pyramidchild1", asyncHandler(async (req, res) => {
    const { user_id } = req.body
    const query1 = `SELECT user_id,next_left,next_right,position FROM pyramid where user_id=${user_id}`
    let newResponse = await db.query(query1)
​
    if (!newResponse.rows) {
      console.log(err.stack);
    } else {
​
      if (newResponse.rows[0].next_left != null) {
        let xx = await preOrder1(newResponse.rows[0].next_left, "left");
      }
      if (newResponse.rows[0].next_right != null) {
        let yy = await preOrder1(newResponse.rows[0].next_right, "right");
      }
​
      let ear
      if (left1 <= right1)
        ear = left1 * 100
      else
        ear = right1 * 100
      res.json({ earning: ear, left: left1, right: right1 })
      left1 = right1 = 0
​
    }
  }
  )
  )
​
​
​
​
  return api;
};