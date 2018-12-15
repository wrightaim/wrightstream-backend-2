const knex = require('../../../db')
const bcrypt = require('bcrypt-as-promised')

function getShopByName(name) {
  return (knex('shops').where({name: name}).first())
}

function getShopByEmail(email) {
  return (knex('shops').where({email: email}).first())
}

function getOneShop(shop_id) {
  return (knex('shops').where({id: shop_id}).first())
}

function getAllShops() {
  return (knex('shops'))
}

function createShop(body) {
  let shop_name = body.shop_name
  let name = body.shop_username
  let email = body.shop_email
  let logo = body.logo
    ? body.logo
    : null
  return getShopByName(name)
  .then(data => {
    if (data)
      throw {
        status : 400,
        message: 'Shop name exists'
      }
    return getShopByEmail(email)
    .then(data => {
      if (data)
        throw {
          status : 400,
          message: 'Email exists'
        }
        return (knex('shops')
        .insert({shop_name, name, email, logo})
        .returning('*'))
    })
  })
  .then(new_shop => {
    return (knex('priority').insert({shop_id: new_shop[0].id}).returning('*'))
  }).then(data => {
    return (knex('shops').where({id: data[0].shop_id}).returning('*'))
  })
}

const updateShop = async (shop_id, name, shop_name, email, logo, archived) => {
  if (name) {
    const checkOldName = await getOneShop(shop_id)
    const checkMainName = await getShopByName(name)
    if (typeof checkMainName === 'object' && checkOldName.name !== name) {
      throw {
        status : 400,
        message: 'Shop name exists'
      }
    }
  }
  if (email) {
    const checkOldEmail = await getOneShop(shop_id)
    const checkMainEmail = await getShopByEmail(email)
    if (typeof checkMainEmail === 'object' && checkOldEmail.email !== email) {
      throw {
        status : 400,
        message: 'Email exists'
      }
    }
  }
  const toUpdate = {}
  name
    ? toUpdate.name = name
    : null
  shop_name
    ? toUpdate.shop_name = shop_name
    : null
  email
    ? toUpdate.email = email
    : null
  logo || logo === null
    ? toUpdate.logo = logo
    : null
  archived || archived === false
    ? toUpdate.archived = archived
    : null
  return (knex('shops').update(toUpdate).where({id: shop_id}).returning('*'))
}

function removeShop(shop_id) {
  return (knex('staff').where({shop_id: shop_id}).del()).then(data => {
    return (knex('shops').where({id: shop_id}).del())
  })
}

////////////////////////////////////////////////////////////////////////////////
//STAFF ROUTING
////////////////////////////////////////////////////////////////////////////////
function getOneStaff(staff_id, shop_id) {
  return (knex('staff').where({id: staff_id, shop_id: shop_id}).first())
}

function getStaffByEmail(staff_email, shop_id) {
  return (knex('staff')
  .where({email: staff_email})
  .andWhere({shop_id:shop_id})
  .first())
}

function getAllStaff(shop_id) {
  return (knex('staff').where({shop_id: shop_id}))
}

function createStaff(body, shop_id) {
  let role = body.role || 1
  return getStaffByEmail(body.email, shop_id).then(data => {
    if (data)
      throw {
        status : 400,
        message: 'Staff member email already exists'
      }
    return bcrypt.hash(body.password, 10)
  }).then(new_password => {
    return (knex('staff').insert({
      shop_id: shop_id,
      role_id: role,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      password: new_password,
      photo: body.photo
    }).returning('*'))
  }).then(function([
    {
      password,
      ...data
    }
  ]) {
    return data
  })
}

const updateStaff = async (shop_id, staff_id, first_name, last_name, unhashed_password, email, photo, role, archived) => {
  if (email) {
    const checkEmail = await getStaffByEmail(email, shop_id)
    if (typeof checkEmail === 'object') {
      throw {
        status : 400,
        message: 'Staff email exists'
      }
    }
  }
  const toUpdate = {}
  first_name
    ? toUpdate.first_name = first_name
    : null
  last_name
    ? toUpdate.last_name = last_name
    : null
  email
    ? toUpdate.email = email
    : null
  photo
    ? toUpdate.photo = photo
    : null
  role
    ? toUpdate.role = role
    : null
  archived || archived === false
    ? toUpdate.archived = archived
    : null
  return bcrypt.hash(unhashed_password, 10).then(password => {
    return (knex('staff').update(toUpdate).where({id: staff_id}).returning('*'))
  }).then(function([
    {
      password,
      ...data
    }
  ]) {
    return data
  })
}

function removeStaff(staff_id) {
  return (knex('staff').where({id: staff_id}).del())
}

module.exports = {
  getShopByName,
  getAllShops,
  getOneShop,
  createShop,
  removeShop,
  updateShop,
  getOneStaff,
  getStaffByEmail,
  getAllStaff,
  createStaff,
  updateStaff,
  removeStaff
}
