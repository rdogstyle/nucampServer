const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter
	.route('/')
	.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
	.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
		Favorite.find({ user: req.user._id })
			.populate('user')
			.populate('campsites')
			.then(favorite => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(favorite);
			})
			.catch(err => next(err));
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then(favorite => {
				if (favorite) {
					req.body.forEach(campsite => {
						if (!favorite.campsites.includes(campsite._id)) {
							favorite.campsites.push(campsite._id);
						}
					});
					favorite
						.save()
						.then(favorite => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(favorite);
						})
						.catch(err => next(err));
				} else {
					Favorite.create({ user: req.user._id, campsites: req.body })
						.then(favorite => {
							console.log('Favorite Created ' + favorite);
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(favorite);
						})
						.catch(err => next(err));
				}
			})
			.catch(err => next(err));
	})
	.put(
		cors.corsWithOptions,
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		(req, res, next) => {
			res.statusCode = 403;
			res.end('PUT operation not supported on');
		}
	)
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOneAndDelete({ user: req.user._id })
			.then(response => {
				res.statusCode = 200;
				if (response) {
					res.setHeader('Content-Type', 'application/json');
					res.json(response);
				} else {
					res.setHeader('Content-Type', 'text/plain');
					res.end('You do not have any favorites to delete.');
				}
			})
			.catch(err => {
				console.log(err);
			});
	});

favoriteRouter
	.route('/:campsiteId')
	.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
	.get(cors.cors, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end('GET operation not supported');
	})
	.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		Favorite.findOne({ user: req.user._id })
			.then(favorite => {
				if (favorite) {
					if (!favorite.campsites.includes(req.params.campsiteId)) {
						favorite.campsites.push(req.params.campsiteId);
						favorite
							.save()
							.then(favorite => {
								res.statusCode = 200;
								res.setHeader(
									'Content-Type',
									'application/json'
								);
								res.json(favorite);
							})
							.catch(err => next(err));
					} else {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'text/plain');
						res.end('That campsite is already a favorite!');
					}
				} else {
					Favorite.create({
						user: req.user._id,
						campsites: [req.params.campsiteId],
					})
						.then(favorite => {
							res.statusCode = 200;
							res.setHeader('Content-Type', 'application/json');
							res.json(favorite);
						})
						.catch(err => next(err));
				}
			})
			.catch(err => next(err));
	})
	.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
		res.statusCode = 403;
		res.end(`POST operation not supported`);
	})
	.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
		console.log(`User ID Checking ${req.user._id}`);
		Favorite.findOne({ user: req.user._id })
			.then(favorite => {
				if (favorite) {
					const index = favorite.campsites.indexOf(
						req.params.campsiteId
					);
					console.log(
						`campsite id checking: ${req.params.campsiteId}`
					);
					if (index >= 0) {
						favorite.campsites.splice(index, 1);
						favorite
							.save()
							.then(favorite => {
								res.statusCode = 200;
								res.setHeader(
									'Content-Type',
									'application/json'
								);
								res.json(favorite);
							})
							.catch(err => next(err));
					} else {
						res.statusCode = 200;
						res.end(
							`That campsite: ${req.params.campsiteId} doesn't exist in the list of favorites!`
						);
					}
				} else {
					res.statusCode = 200;
					res.end(
						`That campsite: ${req.params.campsiteId} has no favorite to delete!`
					);
				}
			})
			.catch(err => next(err));
	});

module.exports = favoriteRouter;
